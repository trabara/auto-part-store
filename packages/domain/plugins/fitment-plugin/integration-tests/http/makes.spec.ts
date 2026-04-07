import { MedusaContainer } from "@medusajs/framework/types";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import jwt from "jsonwebtoken";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import { createTestMake } from "../fixtures/fitment-seeders";

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("/admin/makes", () => {
      const headers: Record<string, string> = {};
      let container: MedusaContainer;
      let userCounter = 0;

      beforeEach(async () => {
        container = getContainer();
        const authModuleService = container.resolve("auth");
        const userModuleService = container.resolve("user");

        const email = `makes-test-${++userCounter}@test.com`;

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
        await expect(api.get("/admin/makes")).rejects.toMatchObject({
          response: { status: 401 },
        });
      });

      // -----------------------------------------------------------------------
      // POST /admin/makes
      // -----------------------------------------------------------------------

      describe("POST /admin/makes", () => {
        it("should create a make and return 201", async () => {
          const res = await api.post(
            "/admin/makes",
            { name: "Toyota" },
            { headers },
          );

          expect(res.status).toBe(201);
          expect(res.data.make).toHaveProperty("id");
          expect(res.data.make.name).toBe("Toyota");
        });

        it("should return 401 without auth", async () => {
          await expect(
            api.post("/admin/makes", { name: "Toyota" }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it("should return 400 when name is missing", async () => {
          await expect(
            api.post("/admin/makes", {}, { headers }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });
      });

      // -----------------------------------------------------------------------
      // GET /admin/makes
      // -----------------------------------------------------------------------

      describe("GET /admin/makes", () => {
        it("should return a list of makes with 200", async () => {
          const res = await api.get("/admin/makes", { headers });

          expect(res.status).toBe(200);
          expect(res.data).toHaveProperty("data");
          expect(res.data).toHaveProperty("metadata");
          expect(Array.isArray(res.data.data)).toBe(true);
        });

        it("should include a seeded make in the list", async () => {
          await createTestMake(container, { name: "Honda-Listed" });

          const res = await api.get("/admin/makes", { headers });

          expect(res.status).toBe(200);
          const found = res.data.data.find(
            (m: any) => m.name === "Honda-Listed",
          );
          expect(found).toBeDefined();
        });
      });

      // -----------------------------------------------------------------------
      // GET /admin/makes/:id
      // -----------------------------------------------------------------------

      describe("GET /admin/makes/:id", () => {
        it("should return a make by id with nested models", async () => {
          const make = await createTestMake(container, { name: "Ford-Get" });

          const res = await api.get(`/admin/makes/${make.id}`, { headers });

          expect(res.status).toBe(200);
          expect(res.data.make.id).toBe(make.id);
          expect(res.data.make.name).toBe("Ford-Get");
          expect(res.data.make).toHaveProperty("models");
        });

        it("should return 404 for a non-existent make", async () => {
          await expect(
            api.get("/admin/makes/does_not_exist", { headers }),
          ).rejects.toMatchObject({ response: { status: 404 } });
        });
      });

      // -----------------------------------------------------------------------
      // PATCH /admin/makes/:id
      // -----------------------------------------------------------------------

      describe("PATCH /admin/makes/:id", () => {
        it("should update a make name and return 200", async () => {
          const make = await createTestMake(container, { name: "OldName" });

          const res = await api.patch(
            `/admin/makes/${make.id}`,
            { name: "NewName" },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.make.name).toBe("NewName");
        });

        it("should return 401 without auth", async () => {
          const make = await createTestMake(container);

          await expect(
            api.patch(`/admin/makes/${make.id}`, { name: "X" }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // PATCH /admin/makes  (batch)
      // -----------------------------------------------------------------------

      describe("PATCH /admin/makes (batch)", () => {
        it("should update multiple makes in one request", async () => {
          const make1 = await createTestMake(container, { name: "Batch-A" });
          const make2 = await createTestMake(container, { name: "Batch-B" });

          const res = await api.patch(
            "/admin/makes",
            {
              makes: [
                { id: make1.id, name: "Batch-A-Updated" },
                { id: make2.id, name: "Batch-B-Updated" },
              ],
            },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.makes).toHaveLength(2);
          const names = res.data.makes.map((m: any) => m.name);
          expect(names).toContain("Batch-A-Updated");
          expect(names).toContain("Batch-B-Updated");
        });

        it("should return 401 without auth", async () => {
          await expect(
            api.patch("/admin/makes", { makes: [] }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // DELETE /admin/makes/:id
      // -----------------------------------------------------------------------

      describe("DELETE /admin/makes/:id", () => {
        it("should delete a make and return 204", async () => {
          const make = await createTestMake(container, { name: "ToDelete" });

          const res = await api.delete(`/admin/makes/${make.id}`, { headers });

          expect(res.status).toBe(204);

          const service =
            container.resolve<FitmentModuleService>(FITMENT_MODULE);
          const remaining = await service.makes.list({ id: make.id });
          expect(remaining).toHaveLength(0);
        });

        it("should return 401 without auth", async () => {
          const make = await createTestMake(container);

          await expect(
            api.delete(`/admin/makes/${make.id}`),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });
    });
  },
});
