import { MedusaContainer } from "@medusajs/framework/types";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import jwt from "jsonwebtoken";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";
import {
  createTestPermission,
  createTestRole,
  ensureAdminAccess,
} from "../fixtures/rbac-seeders";

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("/admin/rbac/v2/roles", () => {
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
        await expect(api.get("/admin/rbac/v2/roles")).rejects.toMatchObject({
          response: { status: 401 },
        });
      });

      describe("POST /admin/rbac/v2/roles", () => {
        it("should create a role with permissions and return 201", async () => {
          const perm = await createTestPermission(container, {
            target: "/admin/roles-test",
          });

          const res = await api.post(
            "/admin/rbac/v2/roles",
            {
              name: "Editor",
              description: "Can edit content",
              permissions: [perm.id],
            },
            { headers },
          );

          expect(res.status).toEqual(201);
          expect(res.data.role).toHaveProperty("id");
          expect(res.data.role.name).toEqual("Editor");
          expect(res.data.role.description).toEqual("Can edit content");
        });

        it("should create a role with multiple permissions", async () => {
          const perm1 = await createTestPermission(container, {
            kind: "read",
            target: "/admin/multi-perm-1",
          });
          const perm2 = await createTestPermission(container, {
            kind: "write",
            target: "/admin/multi-perm-2",
          });

          const res = await api.post(
            "/admin/rbac/v2/roles",
            {
              name: "Multi Perm Role",
              permissions: [perm1.id, perm2.id],
            },
            { headers },
          );

          expect(res.status).toEqual(201);
          expect(res.data.role.name).toEqual("Multi Perm Role");
        });

        it("should return 400 when name is too short", async () => {
          const perm = await createTestPermission(container);

          await expect(
            api.post(
              "/admin/rbac/v2/roles",
              { name: "AB", permissions: [perm.id] },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });

        it("should return 400 when permissions array is empty", async () => {
          await expect(
            api.post(
              "/admin/rbac/v2/roles",
              { name: "No Perms Role", permissions: [] },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });

        it("should return 400 when name is missing", async () => {
          const perm = await createTestPermission(container);

          await expect(
            api.post(
              "/admin/rbac/v2/roles",
              { permissions: [perm.id] },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });
      });

      describe("GET /admin/rbac/v2/roles", () => {
        it("should list roles and return 200", async () => {
          const res = await api.get("/admin/rbac/v2/roles", {
            headers,
          });

          expect(res.status).toEqual(200);
          expect(res.data).toHaveProperty("data");
          expect(res.data).toHaveProperty("metadata");
          expect(Array.isArray(res.data.data)).toBe(true);
        });

        it("should include seeded roles in the list", async () => {
          const perm = await createTestPermission(container);
          await createTestRole(container, [perm.id], {
            name: "Listable Role",
          });

          const res = await api.get("/admin/rbac/v2/roles", {
            headers,
          });

          expect(res.status).toEqual(200);
          const found = res.data.data.find(
            (r: any) => r.name === "Listable Role",
          );
          expect(found).toBeDefined();
        });
      });

      describe("GET /admin/rbac/v2/roles/:id", () => {
        it("should return a role by id", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id], {
            name: "Retrievable Role",
          });

          const res = await api.get(`/admin/rbac/v2/roles/${role.id}`, {
            headers,
          });

          expect(res.status).toEqual(200);
          expect(res.data.role.id).toEqual(role.id);
          expect(res.data.role.name).toEqual("Retrievable Role");
        });

        it("should return 404 for non-existent role", async () => {
          await expect(
            api.get("/admin/rbac/v2/roles/does_not_exist", {
              headers,
            }),
          ).rejects.toMatchObject({
            response: { status: 404 },
          });
        });
      });

      describe("PATCH /admin/rbac/v2/roles/:id", () => {
        it("should update a role name", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id]);

          const res = await api.patch(
            `/admin/rbac/v2/roles/${role.id}`,
            { name: "Updated Role" },
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.role.name).toEqual("Updated Role");
        });

        it("should update a role description", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id]);

          const res = await api.patch(
            `/admin/rbac/v2/roles/${role.id}`,
            { description: "Updated description" },
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.role.description).toEqual("Updated description");
        });

        it("should allow updating role name without length restriction", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id]);

          const res = await api.patch(
            `/admin/rbac/v2/roles/${role.id}`,
            { name: "AB" },
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(res.data.role.name).toEqual("AB");
        });
      });

      describe("DELETE /admin/rbac/v2/roles/:id", () => {
        it("should delete a role and return 204", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id]);

          const res = await api.delete(`/admin/rbac/v2/roles/${role.id}`, {
            headers,
          });

          expect(res.status).toEqual(204);

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const [deleted] = await service.roles.list({
            id: role.id,
          });
          expect(deleted).toBeUndefined();
        });

        it("should cascade delete policies when role is deleted", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id]);

          await api.delete(`/admin/rbac/v2/roles/${role.id}`, {
            headers,
          });

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const policies = await service.policies.list({
            role_id: role.id,
          });
          expect(policies).toHaveLength(0);
        });

        it("should cascade delete members when role is deleted", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id]);

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          await service.members.create([{ user_id: userId, role_id: role.id }]);

          await api.delete(`/admin/rbac/v2/roles/${role.id}`, {
            headers,
          });

          const members = await service.members.list({
            role_id: role.id,
          });
          expect(members).toHaveLength(0);
        });
      });

      describe("POST /admin/rbac/v2/roles/:id/assign", () => {
        it("should assign users to a role", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id], {
            name: "Assignable Role",
          });

          const res = await api.post(
            `/admin/rbac/v2/roles/${role.id}/assign`,
            { userIds: [userId] },
            { headers },
          );

          expect(res.status).toEqual(201);
          expect(res.data.success).toEqual(true);

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const members = await service.members.list({
            role_id: role.id,
          });
          expect(members).toHaveLength(1);
          expect(members[0].user_id).toEqual(userId);
        });

        it("should reassign user from one role to another", async () => {
          const perm = await createTestPermission(container);
          const role1 = await createTestRole(container, [perm.id], {
            name: "Role A",
          });
          const role2 = await createTestRole(container, [perm.id], {
            name: "Role B",
          });

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

          await api.post(
            `/admin/rbac/v2/roles/${role1.id}/assign`,
            { userIds: [userId] },
            { headers },
          );

          // Re-seed admin access since user was reassigned to role1
          await ensureAdminAccess(container, userId);

          await api.post(
            `/admin/rbac/v2/roles/${role2.id}/assign`,
            { userIds: [userId] },
            { headers },
          );

          const members2 = await service.members.list({
            role_id: role2.id,
          });
          expect(members2).toHaveLength(1);
          expect(members2[0].user_id).toEqual(userId);
        });

        it("should remove all members when empty userIds provided", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id]);

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

          await api.post(
            `/admin/rbac/v2/roles/${role.id}/assign`,
            { userIds: [userId] },
            { headers },
          );

          // Re-seed admin access since user was reassigned
          await ensureAdminAccess(container, userId);

          const res = await api.post(
            `/admin/rbac/v2/roles/${role.id}/assign`,
            { userIds: [] },
            { headers },
          );

          expect(res.status).toEqual(201);

          const members = await service.members.list({
            role_id: role.id,
          });
          expect(members).toHaveLength(0);
        });

        it("should return 400 for invalid assign body", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id]);

          await expect(
            api.post(
              `/admin/rbac/v2/roles/${role.id}/assign`,
              { userIds: "not-an-array" },
              { headers },
            ),
          ).rejects.toMatchObject({
            response: { status: 400 },
          });
        });
      });
    });
  },
});
