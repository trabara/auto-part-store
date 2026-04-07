import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { MedusaContainer } from "@medusajs/framework/types";
import jwt from "jsonwebtoken";
import {
  ensureAdminAccess,
  createTestCategory,
} from "../fixtures/rbac-seeders";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("/admin/rbac/v2/categories", () => {
      const headers: Record<string, string> = {};
      let container: MedusaContainer;
      let userId: string;

      beforeEach(async () => {
        container = getContainer();
        const authModuleService = container.resolve("auth");
        const userModuleService = container.resolve("user");

        const user = await userModuleService.createUsers({
          email: "test@test.com",
        });
        userId = user.id;

        const authIdentity = await authModuleService.createAuthIdentities({
          provider_identities: [
            {
              provider: "emailpass",
              entity_id: "test@test.com",
              provider_metadata: {
                password: process.env.JWT_SECRET || "test",
              },
            },
          ],
          app_metadata: {
            user_id: user.id,
          },
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

        await ensureAdminAccess(container, user.id);
      });

      it("should return 401 if no authorization header", async () => {
        await expect(
          api.get("/admin/rbac/v2/categories"),
        ).rejects.toMatchObject({
          response: { status: 401 },
        });
      });

      describe("POST /admin/rbac/v2/categories", () => {
        it("should create a category with permissions and return 201", async () => {
          const res = await api.post(
            "/admin/rbac/v2/categories",
            {
              name: "Products",
              description: "Product management",
              permissions: [
                {
                  kind: "read",
                  target: "/admin/products",
                  type: "predefined",
                },
                {
                  kind: "write",
                  target: "/admin/products",
                  type: "predefined",
                },
              ],
            },
            { headers },
          );

          expect(res.status).toEqual(201);
          expect(res.data.category).toHaveProperty("id");
          expect(res.data.category.name).toEqual("Products");
          expect(res.data.category.description).toEqual("Product management");
          expect(res.data.category.permissions).toHaveLength(2);
        });

        it("should return 400 when name is too short", async () => {
          await expect(
            api.post(
              "/admin/rbac/v2/categories",
              {
                name: "AB",
                permissions: [
                  {
                    kind: "read",
                    target: "/admin/test",
                    type: "custom",
                  },
                ],
              },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });

        it("should create a category with empty permissions array and return 201", async () => {
          const res = await api.post(
            "/admin/rbac/v2/categories",
            {
              name: "Empty Category",
              permissions: [],
            },
            { headers },
          );

          expect(res.status).toEqual(201);
          expect(res.data.category).toHaveProperty("id");
          expect(res.data.category.name).toEqual("Empty Category");
        });

        it("should create a category without permissions field and return 201", async () => {
          const res = await api.post(
            "/admin/rbac/v2/categories",
            { name: "No Permissions" },
            { headers },
          );

          expect(res.status).toEqual(201);
          expect(res.data.category).toHaveProperty("id");
          expect(res.data.category.name).toEqual("No Permissions");
        });

        it("should return 400 for invalid permission kind inside category", async () => {
          await expect(
            api.post(
              "/admin/rbac/v2/categories",
              {
                name: "Bad Perm",
                permissions: [
                  {
                    kind: "invalid",
                    target: "/admin/test",
                    type: "custom",
                  },
                ],
              },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });
      });

      describe("GET /admin/rbac/v2/categories", () => {
        it("should list categories and return 200", async () => {
          const res = await api.get("/admin/rbac/v2/categories", {
            headers,
          });

          expect(res.status).toEqual(200);
          expect(res.data).toHaveProperty("data");
          expect(res.data).toHaveProperty("metadata");
          expect(Array.isArray(res.data.data)).toBe(true);
        });

        it("should include seeded categories in the list", async () => {
          await createTestCategory(container, {
            name: "Listable Category",
            description: "Should appear in list",
            permissions: [
              {
                kind: "read",
                target: "/admin/listable",
                type: "custom",
              },
            ],
          });

          const { data, status } = await api.get("/admin/rbac/v2/categories", {
            headers,
          });

          expect(status).toEqual(200);
          const found = data.data.find(
            (c: any) => c.name === "Listable Category",
          );
          expect(found).toBeDefined();
        });
      });

      describe("GET /admin/rbac/v2/categories/:id", () => {
        it("should return a category by id", async () => {
          const category = await createTestCategory(container);

          const res = await api.get(
            `/admin/rbac/v2/categories/${category.id}`,
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.category.id).toEqual(category.id);
          expect(res.data.category.name).toEqual("Test Category");
        });

        it("should return 404 for non-existent category", async () => {
          await expect(
            api.get("/admin/rbac/v2/categories/does_not_exist", { headers }),
          ).rejects.toMatchObject({
            response: { status: 404 },
          });
        });
      });

      describe("PATCH /admin/rbac/v2/categories/:id", () => {
        it("should update a category name", async () => {
          const category = await createTestCategory(container);

          const res = await api.patch(
            `/admin/rbac/v2/categories/${category.id}`,
            { name: "Updated Category" },
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.category.name).toEqual("Updated Category");
        });

        it("should update a category description", async () => {
          const category = await createTestCategory(container);

          const res = await api.patch(
            `/admin/rbac/v2/categories/${category.id}`,
            { description: "Updated description" },
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.category.description).toEqual("Updated description");
        });

        it("should return 400 for name too short on update", async () => {
          const category = await createTestCategory(container);

          await expect(
            api.patch(
              `/admin/rbac/v2/categories/${category.id}`,
              { name: "AB" },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });
      });

      describe("DELETE /admin/rbac/v2/categories/:id", () => {
        it("should delete a category and return 204", async () => {
          const category = await createTestCategory(container);

          const res = await api.delete(
            `/admin/rbac/v2/categories/${category.id}`,
            { headers },
          );

          expect(res.status).toEqual(204);

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const [deleted] = await service.categories.list({
            id: category.id,
          });
          expect(deleted).toBeUndefined();
        });

        it("should cascade delete permissions when category is deleted", async () => {
          const category = await createTestCategory(container, {
            name: "Cascade Category",
            permissions: [
              {
                kind: "read",
                target: "/admin/cascade-test",
                type: "custom",
              },
            ],
          });

          const res = await api.delete(
            `/admin/rbac/v2/categories/${category.id}`,
            { headers },
          );

          expect(res.status).toEqual(204);

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const perms = await service.permissions.list({
            category_id: category.id,
          });
          expect(perms).toHaveLength(0);
        });

        it("should return 204 even for non-existent category", async () => {
          const res = await api.delete(
            "/admin/rbac/v2/categories/does_not_exist",
            { headers },
          );

          expect(res.status).toEqual(204);
        });
      });
    });
  },
});
