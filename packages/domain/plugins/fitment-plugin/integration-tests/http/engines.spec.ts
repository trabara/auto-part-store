import { MedusaContainer } from "@medusajs/framework/types";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import jwt from "jsonwebtoken";
import {
  FITMENT_MODULE,
  FitmentModuleService,
} from "@repo/domain-modules/fitment";
import { createTestEngine } from "../fixtures/fitment-seeders";

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("/admin/engines", () => {
      const headers: Record<string, string> = {};
      let container: MedusaContainer;
      let userCounter = 0;

      beforeEach(async () => {
        container = getContainer();
        const authModuleService = container.resolve("auth");
        const userModuleService = container.resolve("user");

        const email = `engines-test-${++userCounter}@test.com`;

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
        await expect(api.get("/admin/engines")).rejects.toMatchObject({
          response: { status: 401 },
        });
      });

      // -----------------------------------------------------------------------
      // POST /admin/engines
      // -----------------------------------------------------------------------

      describe("POST /admin/engines", () => {
        it("should create an engine and return 201", async () => {
          const res = await api.post(
            "/admin/engines",
            { fuel: "GASOLINE", type: "V6", size: "3.5" },
            { headers },
          );

          expect(res.status).toBe(201);
          expect(res.data.engine).toHaveProperty("id");
          expect(res.data.engine.fuel).toBe("GASOLINE");
          expect(res.data.engine.type).toBe("V6");
          expect(res.data.engine.size).toBe("3.5");
        });

        it("should create an engine with optional tech field", async () => {
          const res = await api.post(
            "/admin/engines",
            { fuel: "DIESEL", type: "I4", size: "2.0", tech: "TDI" },
            { headers },
          );

          expect(res.status).toBe(201);
          expect(res.data.engine.tech).toBe("TDI");
        });

        it("should return 401 without auth", async () => {
          await expect(
            api.post("/admin/engines", {
              fuel: "GASOLINE",
              type: "I4",
              size: "1.6",
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it("should return 400 when fuel is an invalid enum value", async () => {
          await expect(
            api.post(
              "/admin/engines",
              { fuel: "NUCLEAR", type: "I4", size: "1.6" },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should return 400 when type is an invalid enum value", async () => {
          await expect(
            api.post(
              "/admin/engines",
              { fuel: "GASOLINE", type: "W12", size: "1.6" },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should return 400 when size is not a valid number string", async () => {
          await expect(
            api.post(
              "/admin/engines",
              { fuel: "GASOLINE", type: "I4", size: "large" },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });
      });

      // -----------------------------------------------------------------------
      // GET /admin/engines
      // -----------------------------------------------------------------------

      describe("GET /admin/engines", () => {
        it("should return a list of engines with 200", async () => {
          const res = await api.get("/admin/engines", { headers });

          expect(res.status).toBe(200);
          expect(res.data).toHaveProperty("data");
          expect(res.data).toHaveProperty("metadata");
          expect(Array.isArray(res.data.data)).toBe(true);
        });

        it("should include a seeded engine in the list", async () => {
          await createTestEngine(container, {
            fuel: "HYBRID",
            type: "V6",
            size: "3.3",
          });

          const res = await api.get("/admin/engines", { headers });

          expect(res.status).toBe(200);
          const found = res.data.data.find(
            (e: any) => e.fuel === "HYBRID" && e.size === "3.3",
          );
          expect(found).toBeDefined();
        });

        it("should return engines with all expected fields", async () => {
          await createTestEngine(container, {
            fuel: "ELECTRIC",
            type: "ELECTRIC",
            size: "0.0",
          });

          const res = await api.get("/admin/engines", { headers });

          expect(res.status).toBe(200);
          const [engine] = res.data.data;
          expect(engine).toHaveProperty("id");
          expect(engine).toHaveProperty("fuel");
          expect(engine).toHaveProperty("type");
          expect(engine).toHaveProperty("size");
        });
      });

      // -----------------------------------------------------------------------
      // GET /admin/engines/:id
      // -----------------------------------------------------------------------

      describe("GET /admin/engines/:id", () => {
        it("should return an engine by id", async () => {
          const engine = await createTestEngine(container, {
            fuel: "DIESEL",
            type: "V8",
            size: "5.0",
          });

          const res = await api.get(`/admin/engines/${engine.id}`, { headers });

          expect(res.status).toBe(200);
          expect(res.data.engine.id).toBe(engine.id);
          expect(res.data.engine.fuel).toBe("DIESEL");
        });

        it("should return 404 for a non-existent engine", async () => {
          await expect(
            api.get("/admin/engines/does_not_exist", { headers }),
          ).rejects.toMatchObject({ response: { status: 404 } });
        });
      });

      // -----------------------------------------------------------------------
      // PATCH /admin/engines/:id
      // -----------------------------------------------------------------------

      describe("PATCH /admin/engines/:id", () => {
        it("should update an engine field and return 200", async () => {
          const engine = await createTestEngine(container, {
            fuel: "GASOLINE",
            type: "I4",
            size: "1.8",
          });

          const res = await api.patch(
            `/admin/engines/${engine.id}`,
            { tech: "VTEC" },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.engine.tech).toBe("VTEC");
        });

        it("should return 401 without auth", async () => {
          const engine = await createTestEngine(container);

          await expect(
            api.patch(`/admin/engines/${engine.id}`, { tech: "X" }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });

      // -----------------------------------------------------------------------
      // PATCH /admin/engines  (batch)
      // -----------------------------------------------------------------------

      describe("PATCH /admin/engines (batch)", () => {
        it("should update multiple engines in one request", async () => {
          const engine1 = await createTestEngine(container, {
            fuel: "GASOLINE",
            type: "I4",
            size: "1.4",
          });
          const engine2 = await createTestEngine(container, {
            fuel: "GASOLINE",
            type: "V6",
            size: "2.5",
          });

          const res = await api.patch(
            "/admin/engines",
            {
              engines: [
                { id: engine1.id, tech: "EcoBoost" },
                { id: engine2.id, tech: "VVT" },
              ],
            },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.engines).toHaveLength(2);
          const techs = res.data.engines.map((e: any) => e.tech);
          expect(techs).toContain("EcoBoost");
          expect(techs).toContain("VVT");
        });
      });

      // -----------------------------------------------------------------------
      // DELETE /admin/engines/:id
      // -----------------------------------------------------------------------

      describe("DELETE /admin/engines/:id", () => {
        it("should delete an engine and return 204", async () => {
          const engine = await createTestEngine(container, {
            fuel: "DIESEL",
            type: "I4",
            size: "1.9",
          });

          const res = await api.delete(`/admin/engines/${engine.id}`, {
            headers,
          });

          expect(res.status).toBe(204);

          const service =
            container.resolve<FitmentModuleService>(FITMENT_MODULE);
          const remaining = await service.listFitmentEngines({ id: engine.id });
          expect(remaining).toHaveLength(0);
        });

        it("should return 401 without auth", async () => {
          const engine = await createTestEngine(container);

          await expect(
            api.delete(`/admin/engines/${engine.id}`),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });
      });
    });
  },
});
