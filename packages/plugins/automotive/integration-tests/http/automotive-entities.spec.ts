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
  updateEntitiesWorkflow,
} from "@repo/framework/entity/server";
import { adminHeaders } from "@repo/config/jest/medusa-helpers.cjs";
import {
  VEHICLE_MODULE,
  type VehicleModuleService,
} from "../../src/modules/vehicle";
import { FITMENT_MODULE } from "../../src/modules/fitment";
import FitmentVehicleLink from "../../src/links/fitment-vehicle";

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
        for (const entity of ["fitment_condition", "automotive_attribute", "nope"]) {
          expect(await status(api.get(`/admin/automotive/${entity}`, headers))).toBe(404);
          expect(await status(api.post(`/admin/automotive/${entity}`, {}, headers))).toBe(404);
          expect(
            await status(api.delete(`/admin/automotive/${entity}/x`, headers)),
          ).toBe(404);
        }
      });
    });

    describe("workflow compensation", () => {
      const target = { module: VEHICLE_MODULE, entity: "VehicleEngine" };
      const engines = () => getContainer().resolve<VehicleModuleService>(VEHICLE_MODULE);

      it("undoes a create", async () => {
        const { errors } = await createThenFail(getContainer()).run({
          input: { ...target, data: [{ power: 77 }] },
          throwOnError: false,
        });
        expect(errors[0]?.error?.message).toBe("boom");
        expect(await engines().listVehicleEngines({ power: 77 }, { withDeleted: true })).toEqual([]);
      });

      it("restores previous values after an update", async () => {
        const [engine] = await engines().createVehicleEngines([{ power: 100, name: "before" }]);
        await updateThenFail(getContainer()).run({
          input: { ...target, data: [{ id: engine.id, power: 200, name: "after" }] },
          throwOnError: false,
        });
        const [row] = await engines().listVehicleEngines({ id: engine.id });
        expect(row).toMatchObject({ power: 100, name: "before" });
      });

      it("restores a soft-deleted entity", async () => {
        const [engine] = await engines().createVehicleEngines([{ power: 55 }]);
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
          "/admin/automotive/vehicle_engine",
          { fuel: "DIESEL", type: "V6", size: "3.0", power: 250 },
          headers,
        );
        expect(created.status).toBe(201);
        const id = created.data.data.id;

        const list = await api.get(
          "/admin/automotive/vehicle_engine?power[$gte]=200&fuel=DIESEL",
          headers,
        );
        expect(list.status).toBe(200);
        expect(list.data.data.map((e: any) => e.id)).toEqual([id]);

        const empty = await api.get(
          "/admin/automotive/vehicle_engine?power[$gte]=300",
          headers,
        );
        expect(empty.data.data).toEqual([]);

        // Engine fields validate; previously validated by the vehicle DTO.
        const updated = await api.put(
          `/admin/automotive/vehicle_engine/${id}`,
          { power: 300 },
          headers,
        );
        expect(updated.status).toBe(200);
        expect(updated.data.data.power).toBe(300);

        const batch = await api.put(
          "/admin/automotive/vehicle_engine",
          { entities: [{ id, name: "turbo" }] },
          headers,
        );
        expect(batch.status).toBe(200);

        const detail = await api.get(
          `/admin/automotive/vehicle_engine/${id}?fields=id,power,name`,
          headers,
        );
        expect(detail.data.data).toEqual({ id, power: 300, name: "turbo" });

        const deleted = await api.delete(`/admin/automotive/vehicle_engine/${id}`, headers);
        expect(deleted.data).toEqual({ id, object: "vehicle_engine", deleted: true });
      });

      it("creates a vehicle through FK columns and expands nested relations", async () => {
        const post = (entity: string, body: object) =>
          api.post(`/admin/automotive/${entity}`, body, headers).then((r) => r.data.data);

        const make = await post("vehicle_make", { name: "Toyota", slug: null });
        const model = await post("vehicle_model", {
          name: "Corolla",
          slug: null,
          make_id: make.id,
        });
        const engine = await post("vehicle_engine", { power: 120 });
        const vehicle = await post("vehicle", {
          year_start: 2015,
          year_end: null,
          model_id: model.id,
          engine_id: engine.id,
        });

        const detail = await api.get(
          `/admin/automotive/vehicle/${vehicle.id}?fields=id,year_start,*engine,*model,*model.make`,
          headers,
        );
        expect(detail.status).toBe(200);
        expect(detail.data.data).toMatchObject({
          id: vehicle.id,
          engine: { id: engine.id, power: 120 },
          model: { id: model.id, make: { id: make.id, name: "Toyota" } },
        });

        const byEngine = await api.get(
          `/admin/automotive/vehicle?engine_id=${engine.id}`,
          headers,
        );
        expect(byEngine.data.data.map((v: any) => v.id)).toEqual([vehicle.id]);

        // year_range_check: year_end before year_start is rejected by Postgres.
        expect(
          await status(
            api.put(`/admin/automotive/vehicle/${vehicle.id}`, { year_end: 2000 }, headers),
          ),
        ).toBeGreaterThanOrEqual(400);
      });

      it("soft-deletes: a deleted entity is gone from reads", async () => {
        const created = await api.post(
          "/admin/automotive/vehicle_engine",
          { power: 90 },
          headers,
        );
        const id = created.data.data.id;
        await api.delete(`/admin/automotive/vehicle_engine/${id}`, headers);
        expect(
          await status(api.get(`/admin/automotive/vehicle_engine/${id}`, headers)),
        ).toBe(404);
        const [row] = await getContainer()
          .resolve<VehicleModuleService>(VEHICLE_MODULE)
          .listVehicleEngines({ id }, { withDeleted: true });
        expect(row.deleted_at).toBeTruthy();
      });

      it("rejects an invalid engine payload with 400", async () => {
        expect(
          await status(
            api.post("/admin/automotive/vehicle_engine", { fuel: "STEAM" }, headers),
          ),
        ).toBe(400);
      });
    });

    describe("fitment ↔ vehicle link (cross-module)", () => {
      const post = (entity: string, body: object) =>
        api
          .post(`/admin/automotive/${entity}`, body, headers)
          .then((r) => r.data.data)
          .catch((e) => {
            throw new Error(`POST ${entity}: ${JSON.stringify(e.response?.data)}`);
          });

      let power = 400; // engines are unique by spec
      const createVehicle = async (name: string) => {
        const make = await post("vehicle_make", { name, slug: null });
        const model = await post("vehicle_model", { name: `${name} M`, slug: null, make_id: make.id });
        const engine = await post("vehicle_engine", { power: power++ });
        return post("vehicle", { year_start: 2010, year_end: null, model_id: model.id, engine_id: engine.id });
      };
      /** Live rows of the fitment ↔ vehicle link table matching `filters`. */
      const links = async (filters: Record<string, string>) => {
        const { data } = await getContainer().resolve("query").graph({
          entity: FitmentVehicleLink.entryPoint,
          fields: ["fitment_id", "vehicle_id"],
          filters,
        });
        return data as { fitment_id: string; vehicle_id: string }[];
      };
      const linkedVehicles = async (fitmentId: string) =>
        (await links({ fitment_id: fitmentId })).map((l) => l.vehicle_id);

      it("creates, reads, moves and removes the link through the generic routes", async () => {
        const [v1, v2] = [await createVehicle("Audi"), await createVehicle("BMW")];
        const position = await post("fitment_position", { code: "FL", name: "Front left", category: null });

        const fitment = await post("fitment", {
          notes: "pads",
          position_id: position.id,
          vehicle_id: v1.id,
        });
        expect(fitment).not.toHaveProperty("vehicle_id");
        expect(await linkedVehicles(fitment.id)).toEqual([v1.id]);

        const detail = await api.get(
          `/admin/automotive/fitment/${fitment.id}?fields=id,*vehicle,*position`,
          headers,
        );
        expect(detail.data.data).toMatchObject({
          id: fitment.id,
          vehicle: { id: v1.id },
          position: { id: position.id },
        });

        await api.put(`/admin/automotive/fitment/${fitment.id}`, { vehicle_id: v2.id }, headers);
        expect(await linkedVehicles(fitment.id)).toEqual([v2.id]);

        // Other fields leave the link alone.
        await api.put(`/admin/automotive/fitment/${fitment.id}`, { notes: "discs" }, headers);
        expect(await linkedVehicles(fitment.id)).toEqual([v2.id]);

        // The link is required, so the API rejects null; the workflow unlinks.
        expect(
          await status(
            api.put(`/admin/automotive/fitment/${fitment.id}`, { vehicle_id: null }, headers),
          ),
        ).toBe(400);
        await updateEntitiesWorkflow(getContainer()).run({
          input: { module: FITMENT_MODULE, entity: "Fitment", data: [{ id: fitment.id, vehicle_id: null }] },
        });
        expect(await linkedVehicles(fitment.id)).toEqual([]);

        await api.put(`/admin/automotive/fitment/${fitment.id}`, { vehicle_id: v1.id }, headers);
        await api.delete(`/admin/automotive/fitment/${fitment.id}`, headers);
        expect(await linkedVehicles(fitment.id)).toEqual([]);
      });

      it("rejects a non-string vehicle_id with 400", async () => {
        expect(
          await status(api.post("/admin/automotive/fitment", { vehicle_id: 42 }, headers)),
        ).toBe(400);
      });

      it("compensates links with the rows", async () => {
        const [v1, v2] = [await createVehicle("Kia"), await createVehicle("Seat")];
        const position = await post("fitment_position", { code: "RR", name: "Rear right", category: null });
        const target = { module: FITMENT_MODULE, entity: "Fitment" };

        // Create rolled back → no row, no link.
        const { errors } = await createThenFail(getContainer()).run({
          input: { ...target, data: [{ notes: "ghost", position_id: position.id, vehicle_id: v1.id }] },
          throwOnError: false,
        });
        expect(errors[0]?.error?.message).toBe("boom");
        expect(await links({ vehicle_id: v1.id })).toEqual([]);

        // Update rolled back → the link points at the previous vehicle again.
        const fitment = await post("fitment", { notes: null, position_id: position.id, vehicle_id: v1.id });
        await updateThenFail(getContainer()).run({
          input: { ...target, data: [{ id: fitment.id, vehicle_id: v2.id }] },
          throwOnError: false,
        });
        expect(await linkedVehicles(fitment.id)).toEqual([v1.id]);

        // Delete rolled back → row and link restored.
        await deleteThenFail(getContainer()).run({
          input: { ...target, ids: [fitment.id] },
          throwOnError: false,
        });
        expect(await linkedVehicles(fitment.id)).toEqual([v1.id]);
      });
    });
  },
});
