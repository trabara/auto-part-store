import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createEntitiesStep,
  deleteEntitiesStep,
  updateEntitiesStep,
} from "@repo/framework/entity";
import jwt from "jsonwebtoken";
import {
  AUTOMOTIVE_MODULE,
  type AutomotiveModuleService,
} from "../../src/modules/automotive";

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
      const container = getContainer();
      const user = await container
        .resolve(Modules.USER)
        .createUsers({ email: "admin@test.local" });
      const { projectConfig } = container.resolve(
        ContainerRegistrationKeys.CONFIG_MODULE,
      );
      const token = jwt.sign(
        { actor_id: user.id, actor_type: "user", auth_identity_id: "test" },
        projectConfig.http.jwtSecret as string,
        { expiresIn: "1d" },
      );
      headers = { headers: { authorization: `Bearer ${token}` } };
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
      const target = { module: AUTOMOTIVE_MODULE, entity: "VehicleEngine" };
      const engines = () => getContainer().resolve<AutomotiveModuleService>(AUTOMOTIVE_MODULE);

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
          .resolve<AutomotiveModuleService>(AUTOMOTIVE_MODULE)
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
  },
});
