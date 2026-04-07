import { MedusaContainer } from "@medusajs/framework/types";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import jwt from "jsonwebtoken";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import {
  createTestFitment,
  createTestFitmentHierarchy,
} from "../fixtures/fitment-seeders";

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("/admin/fitments", () => {
      const headers: Record<string, string> = {};
      let container: MedusaContainer;
      let userCounter = 0;

      beforeEach(async () => {
        container = getContainer();
        const authModuleService = container.resolve("auth");
        const userModuleService = container.resolve("user");

        const email = `fitments-test-${++userCounter}@test.com`;

        const user = await userModuleService.createUsers({ email });

        const authIdentity = await authModuleService.createAuthIdentities({
          provider_identities: [
            {
              provider: "emailpass",
              entity_id: email,
              provider_metadata: {
                password: process.env.JWT_SECRET || "test",
              },
            },
          ],
          app_metadata: { user_id: user.id },
        });

        const token = jwt.sign(
          {
            actor_id: user.id,
            actor_type: "user",
            auth_identity_id: authIdentity.id,
          },
          process.env.JWT_SECRET || "test",
          { expiresIn: "1d" },
        );

        headers["Authorization"] = `Bearer ${token}`;
      });

      // -----------------------------------------------------------------------
      // Auth guard
      // -----------------------------------------------------------------------

      it("should return 401 if no authorization header", async () => {
        await expect(api.get("/admin/fitments")).rejects.toMatchObject({
          response: { status: 401 },
        });
      });

      // -----------------------------------------------------------------------
      // POST /admin/fitments
      // -----------------------------------------------------------------------

      describe("POST /admin/fitments", () => {
        it("should create a fitment and return 201", async () => {
          const { model, engine } = await createTestFitmentHierarchy(container);

          const res = await api.post(
            "/admin/fitments",
            {
              model_id: model.id,
              engine_id: engine.id,
              body_style: "SUV",
              doors: 4,
              drive: "AWD",
              transmission: "AUTOMATIC",
              year_start: 2020,
            },
            { headers },
          );

          expect(res.status).toBe(201);
          expect(res.data.fitment).toHaveProperty("id");
          expect(res.data.fitment.body_style).toBe("SUV");
          expect(res.data.fitment.drive).toBe("AWD");
          expect(res.data.fitment.year_start).toBe(2020);
        });

        it("should create a fitment with an optional year_end", async () => {
          const { model, engine } = await createTestFitmentHierarchy(container);

          const res = await api.post(
            "/admin/fitments",
            {
              model_id: model.id,
              engine_id: engine.id,
              body_style: "SEDAN",
              doors: 4,
              drive: "FWD",
              transmission: "MANUAL",
              year_start: 2018,
              year_end: 2022,
            },
            { headers },
          );

          expect(res.status).toBe(201);
          expect(res.data.fitment.year_end).toBe(2022);
        });

        it("should return 401 without auth", async () => {
          const { model, engine } = await createTestFitmentHierarchy(container);

          await expect(
            api.post("/admin/fitments", {
              model_id: model.id,
              engine_id: engine.id,
              body_style: "SEDAN",
              doors: 4,
              drive: "FWD",
              transmission: "MANUAL",
              year_start: 2020,
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it("should return 400 when model_id is missing", async () => {
          const { engine } = await createTestFitmentHierarchy(container);

          await expect(
            api.post(
              "/admin/fitments",
              {
                engine_id: engine.id,
                body_style: "SEDAN",
                doors: 4,
                drive: "FWD",
                transmission: "MANUAL",
                year_start: 2020,
              },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should return 400 when engine_id is missing", async () => {
          const { model } = await createTestFitmentHierarchy(container);

          await expect(
            api.post(
              "/admin/fitments",
              {
                model_id: model.id,
                body_style: "SEDAN",
                doors: 4,
                drive: "FWD",
                transmission: "MANUAL",
                year_start: 2020,
              },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should return 400 when body_style is an invalid enum value", async () => {
          const { model, engine } = await createTestFitmentHierarchy(container);

          await expect(
            api.post(
              "/admin/fitments",
              {
                model_id: model.id,
                engine_id: engine.id,
                body_style: "SPACESHIP",
                doors: 4,
                drive: "FWD",
                transmission: "MANUAL",
                year_start: 2020,
              },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });
      });

      // -----------------------------------------------------------------------
      // GET /admin/fitments
      // -----------------------------------------------------------------------

      describe("GET /admin/fitments", () => {
        it("should return a list of fitments with 200", async () => {
          const res = await api.get("/admin/fitments", { headers });

          expect(res.status).toBe(200);
          expect(res.data).toHaveProperty("data");
          expect(res.data).toHaveProperty("metadata");
          expect(Array.isArray(res.data.data)).toBe(true);
        });

        it("should include a seeded fitment in the list", async () => {
          const { fitment } = await createTestFitmentHierarchy(container, {
            fitmentYear: 2019,
          });

          const res = await api.get("/admin/fitments", { headers });

          expect(res.status).toBe(200);
          const found = res.data.data.find((f: any) => f.id === fitment.id);
          expect(found).toBeDefined();
        });

        it("should return fitments with expected fields", async () => {
          await createTestFitmentHierarchy(container);

          const res = await api.get("/admin/fitments", { headers });

          expect(res.status).toBe(200);
          if (res.data.data.length > 0) {
            const [f] = res.data.data;
            expect(f).toHaveProperty("id");
            expect(f).toHaveProperty("body_style");
            expect(f).toHaveProperty("drive");
            expect(f).toHaveProperty("transmission");
            expect(f).toHaveProperty("year_start");
          }
        });
      });

      // -----------------------------------------------------------------------
      // GET /admin/fitments/:id
      // -----------------------------------------------------------------------

      describe("GET /admin/fitments/:id", () => {
        it("should return a fitment with nested model and engine", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);

          const res = await api.get(`/admin/fitments/${fitment.id}`, {
            headers,
          });

          expect(res.status).toBe(200);
          expect(res.data.fitment.id).toBe(fitment.id);
          expect(res.data.fitment).toHaveProperty("model");
          expect(res.data.fitment).toHaveProperty("engine");
          expect(res.data.fitment.model).toHaveProperty("make");
        });

        it("should return 404 for a non-existent fitment", async () => {
          await expect(
            api.get("/admin/fitments/does_not_exist", { headers }),
          ).rejects.toMatchObject({ response: { status: 404 } });
        });
      });

      // -----------------------------------------------------------------------
      // PATCH /admin/fitments/:id
      // -----------------------------------------------------------------------

      describe("PATCH /admin/fitments/:id", () => {
        it("should update a fitment field and return 200", async () => {
          const { fitment, model, engine } =
            await createTestFitmentHierarchy(container);

          const res = await api.patch(
            `/admin/fitments/${fitment.id}`,
            {
              id: fitment.id,
              model_id: model.id,
              engine_id: engine.id,
              drive: "RWD",
            },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.fitment.drive).toBe("RWD");
        });

        it("should update year_end", async () => {
          const { fitment, model, engine } =
            await createTestFitmentHierarchy(container);

          const res = await api.patch(
            `/admin/fitments/${fitment.id}`,
            {
              id: fitment.id,
              model_id: model.id,
              engine_id: engine.id,
              year_end: 2024,
            },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.fitment.year_end).toBe(2024);
        });

        it("should return 401 without auth", async () => {
          const { fitment, model, engine } =
            await createTestFitmentHierarchy(container);

          await expect(
            api.patch(`/admin/fitments/${fitment.id}`, {
              id: fitment.id,
              model_id: model.id,
              engine_id: engine.id,
              drive: "AWD",
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // DELETE /admin/fitments/:id
      // -----------------------------------------------------------------------

      describe("DELETE /admin/fitments/:id", () => {
        it("should delete a fitment via workflow and return 204", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);

          const res = await api.delete(`/admin/fitments/${fitment.id}`, {
            headers,
          });

          expect(res.status).toBe(204);

          const service =
            container.resolve<FitmentModuleService>(FITMENT_MODULE);
          const remaining = await service.list({ id: fitment.id });
          expect(remaining).toHaveLength(0);
        });

        it("should return 401 without auth", async () => {
          const { fitment } = await createTestFitmentHierarchy(container);

          await expect(
            api.delete(`/admin/fitments/${fitment.id}`),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });
    });
  },
});
