import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { MedusaContainer } from "@medusajs/framework/types";
import jwt from "jsonwebtoken";
import {
  ensureAdminAccess,
  createTestPermission,
} from "../fixtures/rbac-seeders";
import { AUTHZ_MODULE, AuthzModuleService } from "../../src/modules/authz";

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("/admin/rbac/v2/permissions", () => {
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
          api.get("/admin/rbac/v2/permissions"),
        ).rejects.toMatchObject({
          response: { status: 401 },
        });
      });

      describe("POST /admin/rbac/v2/permissions", () => {
        it("should create a permission and return 201", async () => {
          const res = await api.post(
            "/admin/rbac/v2/permissions",
            {
              kind: "read",
              target: "/admin/products",
              type: "custom",
            },
            { headers },
          );

          expect(res.status).toEqual(201);
          expect(res.data.permission).toHaveProperty("id");
          expect(res.data.permission.kind).toEqual("read");
          expect(res.data.permission.target).toEqual("/admin/products");
          expect(res.data.permission.type).toEqual("custom");
        });

        it("should default kind to read when not provided", async () => {
          const res = await api.post(
            "/admin/rbac/v2/permissions",
            {
              target: "/admin/orders",
              type: "custom",
            },
            { headers },
          );

          expect(res.status).toEqual(201);
          expect(res.data.permission.kind).toEqual("read");
        });

        it("should return 400 when target is missing", async () => {
          await expect(
            api.post(
              "/admin/rbac/v2/permissions",
              { kind: "read", type: "custom" },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });

        it("should return 400 for invalid kind value", async () => {
          await expect(
            api.post(
              "/admin/rbac/v2/permissions",
              {
                kind: "invalid",
                target: "/admin/products",
                type: "custom",
              },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });

        it("should return 400 for invalid type value", async () => {
          await expect(
            api.post(
              "/admin/rbac/v2/permissions",
              {
                kind: "read",
                target: "/admin/products",
                type: "invalid",
              },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });
      });

      describe("GET /admin/rbac/v2/permissions", () => {
        it("should list permissions and return 200", async () => {
          const res = await api.get("/admin/rbac/v2/permissions", {
            headers,
          });

          expect(res.status).toEqual(200);
          expect(res.data).toHaveProperty("data");
          expect(res.data).toHaveProperty("metadata");
          expect(Array.isArray(res.data.data)).toBe(true);
        });

        it("should filter permissions by kind", async () => {
          await createTestPermission(container, {
            kind: "write",
            target: "/admin/write-resource",
          });
          await createTestPermission(container, {
            kind: "read",
            target: "/admin/read-resource",
          });

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const writePerms = await service.listAuthzPermissions({
            kind: "write",
          });

          expect(writePerms.length).toBeGreaterThanOrEqual(1);
          writePerms.forEach((perm) => {
            expect(perm.kind).toEqual("write");
          });
        });
      });

      describe("GET /admin/rbac/v2/permissions/:id", () => {
        it("should return a permission by id", async () => {
          const permission = await createTestPermission(container);

          const res = await api.get(
            `/admin/rbac/v2/permissions/${permission.id}`,
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.permission.id).toEqual(permission.id);
          expect(res.data.permission.target).toEqual("/admin/test-resource");
        });

        it("should return 404 for non-existent permission", async () => {
          await expect(
            api.get("/admin/rbac/v2/permissions/does_not_exist", { headers }),
          ).rejects.toMatchObject({
            response: { status: 404 },
          });
        });
      });

      describe("PATCH /admin/rbac/v2/permissions/:id", () => {
        it("should update a permission kind", async () => {
          const permission = await createTestPermission(container);

          const res = await api.patch(
            `/admin/rbac/v2/permissions/${permission.id}`,
            { kind: "delete" },
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.permission.kind).toEqual("delete");
        });

        it("should update a permission target", async () => {
          const permission = await createTestPermission(container);

          const res = await api.patch(
            `/admin/rbac/v2/permissions/${permission.id}`,
            { target: "/admin/updated-resource" },
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.permission.target).toEqual("/admin/updated-resource");
        });

        it("should return 400 for invalid kind on update", async () => {
          const permission = await createTestPermission(container);

          await expect(
            api.patch(
              `/admin/rbac/v2/permissions/${permission.id}`,
              { kind: "invalid" },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });
      });

      describe("DELETE /admin/rbac/v2/permissions/:id", () => {
        it("should delete a permission and return 204", async () => {
          const permission = await createTestPermission(container);

          const res = await api.delete(
            `/admin/rbac/v2/permissions/${permission.id}`,
            { headers },
          );

          expect(res.status).toEqual(204);

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const [deleted] = await service.listAuthzPermissions({
            id: permission.id,
          });
          expect(deleted).toBeUndefined();
        });

        it("should return 204 even for non-existent permission", async () => {
          const res = await api.delete(
            "/admin/rbac/v2/permissions/does_not_exist",
            { headers },
          );

          expect(res.status).toEqual(204);
        });
      });
    });
  },
});
