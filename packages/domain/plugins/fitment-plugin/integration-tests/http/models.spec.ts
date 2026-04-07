import { MedusaContainer } from "@medusajs/framework/types";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import jwt from "jsonwebtoken";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import { createTestMake, createTestModel } from "../fixtures/fitment-seeders";

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("/admin/models", () => {
      const headers: Record<string, string> = {};
      let container: MedusaContainer;
      let userCounter = 0;

      beforeEach(async () => {
        container = getContainer();
        const authModuleService = container.resolve("auth");
        const userModuleService = container.resolve("user");

        const email = `models-test-${++userCounter}@test.com`;

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
        await expect(api.get("/admin/models")).rejects.toMatchObject({
          response: { status: 401 },
        });
      });

      // -----------------------------------------------------------------------
      // POST /admin/models
      // -----------------------------------------------------------------------

      describe("POST /admin/models", () => {
        it("should create a model and return 201", async () => {
          const make = await createTestMake(container, { name: "Toyota-Post" });

          const res = await api.post(
            "/admin/models",
            { name: "Corolla", make_id: make.id },
            { headers },
          );

          expect(res.status).toBe(201);
          expect(res.data.model).toHaveProperty("id");
          expect(res.data.model.name).toBe("Corolla");
        });

        it("should return 401 without auth", async () => {
          const make = await createTestMake(container);

          await expect(
            api.post("/admin/models", { name: "X", make_id: make.id }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it("should return 400 when name is missing", async () => {
          const make = await createTestMake(container);

          await expect(
            api.post("/admin/models", { make_id: make.id }, { headers }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should return 400 when make_id is missing", async () => {
          await expect(
            api.post("/admin/models", { name: "Camry" }, { headers }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });
      });

      // -----------------------------------------------------------------------
      // GET /admin/models
      // -----------------------------------------------------------------------

      describe("GET /admin/models", () => {
        it("should return a list of models with 200", async () => {
          const res = await api.get("/admin/models", { headers });

          expect(res.status).toBe(200);
          expect(res.data).toHaveProperty("data");
          expect(res.data).toHaveProperty("metadata");
          expect(Array.isArray(res.data.data)).toBe(true);
        });

        it("should include a seeded model in the list", async () => {
          const make = await createTestMake(container);
          await createTestModel(container, make.id, { name: "Civic-Listed" });

          const res = await api.get("/admin/models", { headers });

          expect(res.status).toBe(200);
          const found = res.data.data.find(
            (m: any) => m.name === "Civic-Listed",
          );
          expect(found).toBeDefined();
        });
      });

      // -----------------------------------------------------------------------
      // GET /admin/models/:id
      // -----------------------------------------------------------------------

      describe("GET /admin/models/:id", () => {
        it("should return a model by id", async () => {
          const make = await createTestMake(container);
          const model = await createTestModel(container, make.id, {
            name: "Focus-Get",
          });

          const res = await api.get(`/admin/models/${model.id}`, { headers });

          expect(res.status).toBe(200);
          expect(res.data.model.id).toBe(model.id);
          expect(res.data.model.name).toBe("Focus-Get");
        });

        it("should return 404 for a non-existent model", async () => {
          await expect(
            api.get("/admin/models/does_not_exist", { headers }),
          ).rejects.toMatchObject({ response: { status: 404 } });
        });
      });

      // -----------------------------------------------------------------------
      // PATCH /admin/models/:id
      // -----------------------------------------------------------------------

      describe("PATCH /admin/models/:id", () => {
        it("should update a model name and return 200", async () => {
          const make = await createTestMake(container);
          const model = await createTestModel(container, make.id, {
            name: "OldModel",
          });

          const res = await api.patch(
            `/admin/models/${model.id}`,
            { name: "NewModel" },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.model.name).toBe("NewModel");
        });

        it("should reassign a model to a different make", async () => {
          const make1 = await createTestMake(container, { name: "MakeOne" });
          const make2 = await createTestMake(container, { name: "MakeTwo" });
          const model = await createTestModel(container, make1.id, {
            name: "Switcher",
          });

          const res = await api.patch(
            `/admin/models/${model.id}`,
            { make_id: make2.id },
            { headers },
          );

          expect(res.status).toBe(200);
        });

        it("should return 401 without auth", async () => {
          const make = await createTestMake(container);
          const model = await createTestModel(container, make.id);

          await expect(
            api.patch(`/admin/models/${model.id}`, { name: "X" }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // PATCH /admin/models  (batch)
      // -----------------------------------------------------------------------

      describe("PATCH /admin/models (batch)", () => {
        it("should update multiple models in one request", async () => {
          const make = await createTestMake(container);
          const model1 = await createTestModel(container, make.id, {
            name: "BatchM-A",
          });
          const model2 = await createTestModel(container, make.id, {
            name: "BatchM-B",
          });

          const res = await api.patch(
            "/admin/models",
            {
              models: [
                { id: model1.id, name: "BatchM-A-Updated" },
                { id: model2.id, name: "BatchM-B-Updated" },
              ],
            },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.models).toHaveLength(2);
          const names = res.data.models.map((m: any) => m.name);
          expect(names).toContain("BatchM-A-Updated");
          expect(names).toContain("BatchM-B-Updated");
        });
      });

      // -----------------------------------------------------------------------
      // DELETE /admin/models/:id
      // -----------------------------------------------------------------------

      describe("DELETE /admin/models/:id", () => {
        it("should delete a model and return 204", async () => {
          const make = await createTestMake(container);
          const model = await createTestModel(container, make.id, {
            name: "ToDeleteModel",
          });

          const res = await api.delete(`/admin/models/${model.id}`, {
            headers,
          });

          expect(res.status).toBe(204);

          const service =
            container.resolve<FitmentModuleService>(FITMENT_MODULE);
          const remaining = await service.models.list({ id: model.id });
          expect(remaining).toHaveLength(0);
        });

        it("should return 401 without auth", async () => {
          const make = await createTestMake(container);
          const model = await createTestModel(container, make.id);

          await expect(
            api.delete(`/admin/models/${model.id}`),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });
    });
  },
});
