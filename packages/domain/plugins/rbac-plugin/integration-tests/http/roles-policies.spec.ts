import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { MedusaContainer } from "@medusajs/framework/types";
import jwt from "jsonwebtoken";
import {
  ensureAdminAccess,
  createTestPermission,
  createTestRole,
} from "../fixtures/rbac-seeders";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("PATCH /admin/rbac/v2/roles/:id/policies", () => {
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
        const perm = await createTestPermission(container);
        const role = await createTestRole(container, [perm.id]);

        await expect(
          api.patch(`/admin/rbac/v2/roles/${role.id}/policies`, {
            permissions: [perm.id],
          }),
        ).rejects.toMatchObject({
          response: { status: 401 },
        });
      });

      it("should replace a role's policies and return 200", async () => {
        const perm1 = await createTestPermission(container, {
          target: "/admin/policies-test-1",
        });
        const perm2 = await createTestPermission(container, {
          target: "/admin/policies-test-2",
        });
        const role = await createTestRole(container, [perm1.id]);

        const res = await api.patch(
          `/admin/rbac/v2/roles/${role.id}/policies`,
          { permissions: [perm2.id] },
          { headers },
        );

        expect(res.status).toEqual(200);

        const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
        const policies = await service.listAuthzPolicies({ role_id: role.id });

        expect(policies).toHaveLength(1);
        expect(policies[0].permission_id).toEqual(perm2.id);
      });

      it("should allow assigning multiple permissions at once", async () => {
        const perm1 = await createTestPermission(container, {
          target: "/admin/multi-policy-1",
        });
        const perm2 = await createTestPermission(container, {
          target: "/admin/multi-policy-2",
        });
        const perm3 = await createTestPermission(container, {
          target: "/admin/multi-policy-3",
        });
        const role = await createTestRole(container, [perm1.id]);

        const res = await api.patch(
          `/admin/rbac/v2/roles/${role.id}/policies`,
          { permissions: [perm2.id, perm3.id] },
          { headers },
        );

        expect(res.status).toEqual(200);

        const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
        const policies = await service.listAuthzPolicies({ role_id: role.id });
        const permissionIds = policies.map((p: any) => p.permission_id).sort();

        expect(policies).toHaveLength(2);
        expect(permissionIds).toEqual([perm2.id, perm3.id].sort());
      });

      it("should clear all policies when permissions is empty", async () => {
        const perm = await createTestPermission(container, {
          target: "/admin/clear-policies",
        });
        const role = await createTestRole(container, [perm.id]);

        const res = await api.patch(
          `/admin/rbac/v2/roles/${role.id}/policies`,
          { permissions: [] },
          { headers },
        );

        expect(res.status).toEqual(200);

        const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
        const policies = await service.listAuthzPolicies({ role_id: role.id });
        expect(policies).toHaveLength(0);
      });

      it("should return 400 when permissions is missing from the body", async () => {
        const perm = await createTestPermission(container);
        const role = await createTestRole(container, [perm.id]);

        await expect(
          api.patch(
            `/admin/rbac/v2/roles/${role.id}/policies`,
            {},
            { headers },
          ),
        ).rejects.toMatchObject({
          response: { status: 400 },
        });
      });

      it("should return 400 when permissions is not an array", async () => {
        const perm = await createTestPermission(container);
        const role = await createTestRole(container, [perm.id]);

        await expect(
          api.patch(
            `/admin/rbac/v2/roles/${role.id}/policies`,
            { permissions: "not-an-array" },
            { headers },
          ),
        ).rejects.toMatchObject({
          response: { status: 400 },
        });
      });
    });
  },
});
