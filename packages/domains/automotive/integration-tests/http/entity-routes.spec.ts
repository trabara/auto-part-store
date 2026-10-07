import { adminUrl } from "../admin-url";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import {
  createStep,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createEntitiesStep,
  deleteEntitiesStep,
  updateEntitiesStep,
} from "@repo/framework/entity/server";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";
import {
  VEHICLE_MODULE,
  type VehicleModuleService,
} from "@repo/module-vehicle";
import { FITMENT_MODULE } from "@repo/module-fitment";
import { AutomotiveAttribute, Fitment } from "@repo/module-fitment/contract";
import { entityLabel } from "@repo/framework/entity";
import { EngineLayout, Vehicle } from "@repo/module-vehicle/contract";

// Each CRUD step followed by a step that always fails, to exercise compensation.
const failStep = createStep("test-fail", async () => {
  throw new Error("boom");
});
const createThenFail = createWorkflow("test-create-then-fail", (input: any) => {
  const created = createEntitiesStep(input);
  failStep();
  return new WorkflowResponse(created);
});
const updateThenFail = createWorkflow("test-update-then-fail", (input: any) => {
  const updated = updateEntitiesStep(input);
  failStep();
  return new WorkflowResponse(updated);
});
const deleteThenFail = createWorkflow("test-delete-then-fail", (input: any) => {
  const deleted = deleteEntitiesStep(input);
  failStep();
  return new WorkflowResponse(deleted);
});

jest.setTimeout(60 * 1000);

/** A create payload for an engine (nullable fields are required keys). */
const engineBody = (power_kw: number, extra: Record<string, unknown> = {}) => ({
  code: null,
  layout: "INLINE",
  cylinders: 4,
  displacement_cc: 1600,
  power_kw,
  ...extra,
});

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: { headers: Record<string, string> };

    beforeEach(async () => {
      headers = await adminHeaders(getContainer());
    });

    const status = (p: Promise<any>) =>
      p.then((r) => r.status).catch((e) => e.response?.status);

    describe("entity allowlist", () => {
      it("404s for models not exposed by the generic routes", async () => {
        // Condition rows are edited as a tree; vehicles are the vehicle module's.
        for (const entity of ["fitment_condition", "fitment_condition_group", "vehicle", "nope"]) {
          expect(await status(api.get(`/admin/fitments/${entity}`, headers))).toBe(404);
          expect(await status(api.post(`/admin/fitments/${entity}`, {}, headers))).toBe(404);
          expect(
            await status(api.delete(`/admin/fitments/${entity}/x`, headers)),
          ).toBe(404);
        }
      });
    });

    describe("workflow compensation", () => {
      const target = { module: VEHICLE_MODULE, entity: "VehicleEngine" };
      const engines = () => getContainer().resolve<VehicleModuleService>(VEHICLE_MODULE);

      it("undoes a create", async () => {
        const { errors } = await createThenFail(getContainer()).run({
          input: { ...target, data: [engineBody(77)] },
          throwOnError: false,
        });
        expect(errors[0]?.error?.message).toBe("boom");
        expect(await engines().listVehicleEngines({ power_kw: 77 }, { withDeleted: true })).toEqual([]);
      });

      it("restores previous values after an update", async () => {
        const [engine] = await engines().createVehicleEngines([{ layout: EngineLayout.INLINE, cylinders: 4, displacement_cc: 1600, power_kw: 100, power_hp: 134, code: null, name: "before" }]);
        await updateThenFail(getContainer()).run({
          input: { ...target, data: [{ id: engine.id, power_kw: 200, name: "after" }] },
          throwOnError: false,
        });
        const [row] = await engines().listVehicleEngines({ id: engine.id });
        expect(row).toMatchObject({ power_kw: 100, power_hp: 134, name: "before" });
      });

      it("restores a soft-deleted entity", async () => {
        const [engine] = await engines().createVehicleEngines([{ layout: EngineLayout.INLINE, cylinders: 4, displacement_cc: 1600, power_kw: 55, power_hp: 74, code: null }]);
        await deleteThenFail(getContainer()).run({
          input: { ...target, ids: [engine.id] },
          throwOnError: false,
        });
        const [row] = await engines().listVehicleEngines({ id: engine.id });
        expect(row?.deleted_at).toBeFalsy();
      });
    });

    describe("vehicle engine CRUD", () => {
      it("creates, filters, updates (engine DTO) and deletes", async () => {
        const created = await api.post(
          "/admin/vehicles/vehicle_engine",
          engineBody(250, { fuel: "DIESEL", layout: "V", cylinders: 6, displacement_cc: 3000 }),
          headers,
        );
        expect(created.status).toBe(201);
        const id = created.data.data.id;

        const list = await api.get(
          "/admin/vehicles/vehicle_engine?power_kw[$gte]=200&fuel=DIESEL",
          headers,
        );
        expect(list.status).toBe(200);
        expect(list.data.data.map((e: any) => e.id)).toEqual([id]);

        const empty = await api.get(
          "/admin/vehicles/vehicle_engine?power_kw[$gte]=300",
          headers,
        );
        expect(empty.data.data).toEqual([]);

        // Engine fields validate; previously validated by the vehicle DTO.
        const updated = await api.put(
          `/admin/vehicles/vehicle_engine/${id}`,
          { power_kw: 300 },
          headers,
        );
        expect(updated.status).toBe(200);
        // power_hp is derived from power_kw on every write.
        expect(updated.data.data).toMatchObject({ power_kw: 300, power_hp: 402 });

        const batch = await api.put(
          "/admin/vehicles/vehicle_engine",
          { entities: [{ id, name: "turbo" }] },
          headers,
        );
        expect(batch.status).toBe(200);

        const detail = await api.get(
          `/admin/vehicles/vehicle_engine/${id}?fields=id,power_kw,power_hp,name`,
          headers,
        );
        expect(detail.data.data).toEqual({ id, power_kw: 300, power_hp: 402, name: "turbo" });

        const deleted = await api.delete(`/admin/vehicles/vehicle_engine/${id}`, headers);
        expect(deleted.data).toEqual({ id, object: "vehicle_engine", deleted: true });
      });

      it("creates a vehicle through FK columns and expands nested relations", async () => {
        const post = (entity: string, body: object) =>
          api.post(adminUrl(entity), body, headers).then((r) => r.data.data);

        const make = await post("vehicle_make", { name: "Toyota", slug: null });
        const model = await post("vehicle_model", {
          name: "Corolla",
          slug: null,
          make_id: make.id,
        });
        const engine = await post("vehicle_engine", engineBody(120));
        const generation = await post("vehicle_generation", {
          name: "E210",
          code: null,
          year_start: 2012,
          year_end: null,
          image: null,
          model_id: model.id,
        });
        const vehicle = await post("vehicle", {
          year_start: 2015,
          year_end: null,
          trim: "Comfort",
          generation_id: generation.id,
          engine_id: engine.id,
        });

        const detail = await api.get(
          `/admin/vehicles/vehicle/${vehicle.id}?fields=id,year_start,*engine,*generation,*generation.model,generation.model.make.name`,
          headers,
        );
        expect(detail.status).toBe(200);
        expect(detail.data.data).toMatchObject({
          id: vehicle.id,
          engine: { id: engine.id, power_kw: 120, power_hp: 161 },
          generation: { id: generation.id, model: { id: model.id, make: { name: "Toyota" } } },
        });
        const labelled = await api.get(
          `/admin/vehicles/vehicle/${vehicle.id}?fields=${["id", ...Vehicle.label.fields].join(",")}`,
          headers,
        );
        expect(entityLabel(Vehicle, labelled.data.data)).toBe(
          "Toyota Corolla E210 Comfort 2015– · 1.6 gasoline I4 120 kW (161 hp)",
        );

        const byEngine = await api.get(
          `/admin/vehicles/vehicle?engine_id=${engine.id}`,
          headers,
        );
        expect(byEngine.data.data.map((v: any) => v.id)).toEqual([vehicle.id]);

        // Check constraint → readable 400 (was a 500).
        const reversed = await api
          .put(`/admin/vehicles/vehicle/${vehicle.id}`, { year_end: 2014 }, headers)
          .catch((e) => e.response);
        expect(reversed.status).toBe(400);
        expect(reversed.data.message).toBe("The last production year can't be before the first.");

        // Years outside the generation's (hook).
        const outside = await api
          .put(`/admin/vehicles/vehicle/${vehicle.id}`, { year_start: 2010 }, headers)
          .catch((e) => e.response);
        expect(outside.status).toBe(400);
        expect(outside.data.message).toBe("Production years must be within the generation's (2012–).");
      });

      it("soft-deletes: a deleted entity is gone from reads", async () => {
        const created = await api.post(
          "/admin/vehicles/vehicle_engine",
          engineBody(90),
          headers,
        );
        const id = created.data.data.id;
        await api.delete(`/admin/vehicles/vehicle_engine/${id}`, headers);
        expect(
          await status(api.get(`/admin/vehicles/vehicle_engine/${id}`, headers)),
        ).toBe(404);
        const [row] = await getContainer()
          .resolve<VehicleModuleService>(VEHICLE_MODULE)
          .listVehicleEngines({ id }, { withDeleted: true });
        expect(row.deleted_at).toBeTruthy();
      });

      it("rejects an invalid engine payload with 400", async () => {
        expect(
          await status(
            api.post("/admin/vehicles/vehicle_engine", { fuel: "STEAM" }, headers),
          ),
        ).toBe(400);
      });
    });

    describe("fitments (applications: variant × vehicle)", () => {
      const post = (entity: string, body: object) =>
        api
          .post(adminUrl(entity), body, headers)
          .then((r) => r.data.data)
          .catch((e) => {
            throw new Error(`POST ${entity}: ${JSON.stringify(e.response?.data)}`);
          });

      let power = 400; // engines are unique by spec
      const createVehicle = async (name: string) => {
        const make = await post("vehicle_make", { name, slug: null });
        const model = await post("vehicle_model", { name: `${name} M`, slug: null, make_id: make.id });
        const engine = await post("vehicle_engine", engineBody(power++));
        const generation = await post("vehicle_generation", {
          name: "Gen", code: null, year_start: 2005, year_end: null, image: null, model_id: model.id,
        });
        return post("vehicle", { year_start: 2010, year_end: 2020, trim: null, generation_id: generation.id, engine_id: engine.id });
      };
      let sku = 0;
      const createVariant = async (title: string) => {
        const { data } = await api.post(
          "/admin/products",
          {
            title,
            options: [{ title: "Default", values: ["Default"] }],
            variants: [
              { title: "Default", sku: `SKU-${++sku}`, options: { Default: "Default" }, prices: [] },
            ],
          },
          headers,
        );
        return data.product.variants[0] as { id: string; sku: string };
      };
      const fitment = (body: object) =>
        api.post("/admin/fitments/fitment", { notes: null, from_year: null, from_month: null, to_year: null, to_month: null, ...body }, headers);

      it("creates an application and reads its part and vehicle through read-only links", async () => {
        const [vehicle, variant] = [await createVehicle("Audi"), await createVariant("Brake pads")];
        const position = await post("fitment_position", { code: "FL", name: "Front left", category: null });

        const created = (await fitment({ variant_id: variant.id, vehicle_id: vehicle.id, position_id: position.id, quantity: 2 })).data.data;
        expect(created).toMatchObject({ variant_id: variant.id, vehicle_id: vehicle.id, quantity: 2 });

        const fields = ["id", "*vehicle", "*variant", ...Fitment.label.fields].join(",");
        const { data } = await api.get(`/admin/fitments/fitment/${created.id}?fields=${fields}`, headers);
        expect(data.data).toMatchObject({ vehicle: { id: vehicle.id }, variant: { id: variant.id, sku: variant.sku } });
        expect(entityLabel(Fitment, data.data)).toMatch(
          new RegExp(`^Brake pads · Default \\(${variant.sku}\\) → Audi Audi M Gen 2010–2020 · 1\\.6 gasoline I4 \\d+ kW \\(\\d+ hp\\)$`),
        );
      });

      it("finds a variant's and a vehicle's fitments by column", async () => {
        const [v1, v2, part] = [await createVehicle("BMW"), await createVehicle("Seat"), await createVariant("Filter")];
        const a = (await fitment({ variant_id: part.id, vehicle_id: v1.id })).data.data;
        const b = (await fitment({ variant_id: part.id, vehicle_id: v2.id })).data.data;

        const byVariant = await api.get(`/admin/fitments/fitment?variant_id=${part.id}&fields=id`, headers);
        expect(byVariant.data.data.map((f: any) => f.id).sort()).toEqual([a.id, b.id].sort());
        const byVehicle = await api.get(`/admin/fitments/fitment?vehicle_id=${v2.id}&fields=id`, headers);
        expect(byVehicle.data.data.map((f: any) => f.id)).toEqual([b.id]);
      });

      it("allows one application per variant, vehicle and position (missing position included)", async () => {
        const [vehicle, part] = [await createVehicle("Kia"), await createVariant("Wiper")];
        const position = await post("fitment_position", { code: "RR", name: "Rear right", category: null });
        const base = { variant_id: part.id, vehicle_id: vehicle.id };

        expect((await fitment(base)).status).toBe(201);
        const duplicate = await fitment(base).catch((e) => e.response);
        expect(duplicate.status).toBe(400);
        expect(duplicate.data.message).toBe("This part is already fitted to this vehicle in this position.");
        expect((await fitment({ ...base, position_id: position.id })).status).toBe(201);
        expect(await status(fitment({ ...base, position_id: position.id }))).toBeGreaterThanOrEqual(400);
      });

      it("validates quantity and the production window", async () => {
        const [vehicle, part] = [await createVehicle("Opel"), await createVariant("Disc")];
        const base = { variant_id: part.id, vehicle_id: vehicle.id };
        expect(await status(fitment({ ...base, quantity: 0 }))).toBe(400);
        expect(await status(fitment({ ...base, from_month: 13, from_year: 2015 }))).toBe(400);
        // Month without a year, and a window ending before it starts: DB checks.
        expect(await status(fitment({ ...base, from_month: 3 }))).toBeGreaterThanOrEqual(400);
        expect(await status(fitment({ ...base, from_year: 2018, to_year: 2016 }))).toBeGreaterThanOrEqual(400);
        expect(await status(fitment({ ...base, from_year: 2018, from_month: 6, to_year: 2018, to_month: 3 }))).toBeGreaterThanOrEqual(400);
        expect((await fitment({ ...base, from_year: 2018, from_month: 3, to_year: 2018, to_month: 6 })).status).toBe(201);
      });

      it("requires the part and the vehicle", async () => {
        const vehicle = await createVehicle("Fiat");
        expect(await status(fitment({ vehicle_id: vehicle.id }))).toBe(400);
        expect(await status(fitment({ variant_id: "variant_x" }))).toBe(400);
        // An empty id is a validation error, not a relation lookup (was a 500).
        const part = await createVariant("Hose");
        expect(await status(fitment({ variant_id: part.id, vehicle_id: vehicle.id, position_id: "" }))).toBe(400);
      });

      it("rolls back a failed create", async () => {
        const [vehicle, part] = [await createVehicle("Mini"), await createVariant("Bulb")];
        const { errors } = await createThenFail(getContainer()).run({
          input: { module: FITMENT_MODULE, entity: "Fitment", data: [{ variant_id: part.id, vehicle_id: vehicle.id, quantity: 1 }] },
          throwOnError: false,
        });
        expect(errors[0]?.error?.message).toBe("boom");
        const list = await api.get(`/admin/fitments/fitment?variant_id=${part.id}&fields=id`, headers);
        expect(list.data.data).toEqual([]);
      });

      it("only accepts catalog paths (vehicle fields) as condition attribute codes", async () => {
        const attribute = AutomotiveAttribute.dto.create;
        const base = { name: "Fuel", data_type: "enum", default_unit: null, category: null };
        expect(attribute.parse({ ...base, code: " Engine.Fuel " }).code).toBe("engine.fuel");
        expect(() => attribute.parse({ ...base, code: "colour" })).toThrow(/must be a field conditions can test/);
      });
    });

    describe("image fields", () => {
      it("stores, returns and clears make logos and model images", async () => {
        const logo = "https://cdn.example.com/logo.png";
        const make = await api
          .post("/admin/vehicles/vehicle_make", { name: "Volvo", slug: null, logo }, headers)
          .then((r) => r.data.data);
        expect(make.logo).toBe(logo);

        const model = await api
          .post("/admin/vehicles/vehicle_model", { name: "XC60", slug: null, make_id: make.id }, headers)
          .then((r) => r.data.data);
        expect(model.image).toBeNull();

        const updated = await api.put(
          `/admin/vehicles/vehicle_model/${model.id}`,
          { image: "https://cdn.example.com/xc60.png" },
          headers,
        );
        expect(updated.data.data.image).toBe("https://cdn.example.com/xc60.png");

        const cleared = await api.put(`/admin/vehicles/vehicle_make/${make.id}`, { logo: null }, headers);
        expect(cleared.data.data.logo).toBeNull();
      });
    });

    describe("data integrity", () => {
      const post = (entity: string, body: object) => api.post(adminUrl(entity), body, headers);

      it("scopes model names to their make", async () => {
        const ford = (await post("vehicle_make", { name: "Ford", slug: null })).data.data;
        const gmc = (await post("vehicle_make", { name: "GMC", slug: null })).data.data;
        expect((await post("vehicle_model", { name: "Sierra", slug: null, make_id: ford.id })).status).toBe(201);
        expect((await post("vehicle_model", { name: "Sierra", slug: null, make_id: gmc.id })).status).toBe(201);
        expect(
          await status(post("vehicle_model", { name: "Sierra", slug: null, make_id: ford.id })),
        ).toBeGreaterThanOrEqual(400);
      });

      const generationFor = async (makeName: string, modelName: string, year_start = 2000) => {
        const make = (await post("vehicle_make", { name: makeName, slug: null })).data.data;
        const model = (await post("vehicle_model", { name: modelName, slug: null, make_id: make.id })).data.data;
        return (
          await post("vehicle_generation", {
            name: "Gen", code: null, year_start, year_end: null, image: null, model_id: model.id,
          })
        ).data.data;
      };

      it("rejects configurations whose years overlap (exclusion constraint), open-ended included", async () => {
        const generation = await generationFor("Skoda", "Octavia");
        const engine = (await post("vehicle_engine", engineBody(110, { displacement_cc: 2000 }))).data.data;
        const base = { generation_id: generation.id, engine_id: engine.id, trim: null };
        const vehicle = (year_start: number, year_end: number | null, extra = {}) =>
          post("vehicle", { ...base, year_start, year_end, ...extra }).catch((e) => e.response);
        const overlap =
          "A vehicle with the same generation, engine and specifications already covers some of these years.";

        expect((await vehicle(2015, 2020)).status).toBe(201);
        for (const [start, end] of [[2015, 2020], [2018, 2022], [2010, 2015], [2019, null]] as const) {
          const res = await vehicle(start, end);
          expect([res.status, res.data.message]).toEqual([400, overlap]);
        }
        expect((await vehicle(2021, null)).status).toBe(201);
        expect((await vehicle(2030, null)).status).toBe(400); // open-ended 2021– covers it
        // Another trim (or body, drive…) is another configuration.
        expect((await vehicle(2015, 2020, { trim: "GTI" })).status).toBe(201);
      });

      it("requires an engine's power; derives hp; keeps engines unique by specification", async () => {
        expect(await status(post("vehicle_engine", { layout: "INLINE" }))).toBe(400);
        const ev = (await post("vehicle_engine", engineBody(150, { fuel: "ELECTRIC", layout: "ELECTRIC_MOTOR", cylinders: null, displacement_cc: null }))).data.data;
        expect(ev).toMatchObject({ power_kw: 150, power_hp: 201 });
        const dup = await post("vehicle_engine", engineBody(150, { fuel: "ELECTRIC", layout: "ELECTRIC_MOTOR", cylinders: null, displacement_cc: null })).catch((e) => e.response);
        expect([dup.status, dup.data.message]).toEqual([400, "An engine with these specifications already exists."]);
      });

      it("normalises position codes to uppercase and keeps them unique", async () => {
        const created = await post("fitment_position", { code: " rl ", name: "Rear left", category: null });
        expect(created.data.data.code).toBe("RL");
        const dup = await post("fitment_position", { code: "RL", name: "Rear left 2", category: null }).catch((e) => e.response);
        expect(dup.status).toBe(400);
        expect(dup.data.message).toBe("A fitment position with this code already exists.");
      });

      it("compares make and model names case-insensitively", async () => {
        const make = (await post("vehicle_make", { name: "Peugeot", slug: null })).data.data;
        const dup = await post("vehicle_make", { name: "PEUGEOT", slug: null }).catch((e) => e.response);
        expect(dup.status).toBe(400);
        expect(dup.data.message).toBe("A vehicle make with this name already exists.");
        expect((await post("vehicle_model", { name: "208", slug: null, make_id: make.id })).status).toBe(201);
        expect((await post("vehicle_model", { name: "Partner", slug: null, make_id: make.id })).status).toBe(201);
        const dup2 = await post("vehicle_model", { name: "partner", slug: null, make_id: make.id }).catch((e) => e.response);
        expect(dup2.status).toBe(400);
        expect(dup2.data.message).toBe("This make already has a model with this name.");
      });

      it("bounds production years", async () => {
        const generation = await generationFor("Fiat", "Panda", 1886);
        const engine = (await post("vehicle_engine", engineBody(51, { displacement_cc: 1200 }))).data.data;
        const vehicle = (year_start: number) =>
          post("vehicle", { generation_id: generation.id, engine_id: engine.id, trim: null, year_start, year_end: null });
        expect(await status(vehicle(1800))).toBe(400);
        expect(await status(vehicle(new Date().getFullYear() + 3))).toBe(400);
        expect(await status(vehicle(2012.5))).toBe(400);
        expect((await vehicle(2012)).status).toBe(201);
      });
    });
  },
});
