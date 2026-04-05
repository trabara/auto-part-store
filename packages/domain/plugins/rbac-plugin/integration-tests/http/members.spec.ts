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
    describe("/admin/rbac/v2/members", () => {
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
        await expect(api.get("/admin/rbac/v2/members")).rejects.toMatchObject({
          response: { status: 401 },
        });
      });

      describe("GET /admin/rbac/v2/members", () => {
        it("should list members and return 200", async () => {
          const res = await api.get("/admin/rbac/v2/members", { headers });

          expect(res.status).toEqual(200);
          expect(res.data).toHaveProperty("data");
          expect(res.data).toHaveProperty("metadata");
          expect(Array.isArray(res.data.data)).toBe(true);
        });

        it("should include the seeded admin member in the list", async () => {
          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const [member] = await service.listAuthzMembers({ user_id: userId });

          expect(member).toBeDefined();

          const res = await api.get("/admin/rbac/v2/members", { headers });
          const found = res.data.data.find((m: any) => m.user_id === userId);
          expect(found).toBeDefined();
        });

        it("should filter members by role_id", async () => {
          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const [existingMember] = await service.listAuthzMembers({
            user_id: userId,
          });

          const res = await api.get(
            `/admin/rbac/v2/members?role_id=${existingMember.role_id}`,
            { headers },
          );

          expect(res.status).toEqual(200);
          expect(
            res.data.data.every(
              (m: any) => m.role_id === existingMember.role_id,
            ),
          ).toBe(true);
        });
      });

      describe("GET /admin/rbac/v2/members/:id", () => {
        it("should return a member by id", async () => {
          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const [member] = await service.listAuthzMembers({ user_id: userId });

          const res = await api.get(`/admin/rbac/v2/members/${member.id}`, {
            headers,
          });

          expect(res.status).toEqual(200);
          expect(res.data.member.id).toEqual(member.id);
          expect(res.data.member.user_id).toEqual(userId);
        });

        it("should return 404 for non-existent member", async () => {
          await expect(
            api.get("/admin/rbac/v2/members/does_not_exist", { headers }),
          ).rejects.toMatchObject({
            response: { status: 404 },
          });
        });
      });

      describe("DELETE /admin/rbac/v2/members/:id", () => {
        it("should delete a member and return 204", async () => {
          const perm = await createTestPermission(container);
          const role = await createTestRole(container, [perm.id]);

          const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
          const [newMember] = await service.createAuthzMembers([
            { user_id: "extra_user_id", role_id: role.id },
          ]);

          const res = await api.delete(
            `/admin/rbac/v2/members/${newMember.id}`,
            { headers },
          );

          expect(res.status).toEqual(204);

          const remaining = await service.listAuthzMembers({
            id: newMember.id,
          });
          expect(remaining).toHaveLength(0);
        });

        it("should return 204 even for a non-existent member", async () => {
          const res = await api.delete(
            "/admin/rbac/v2/members/does_not_exist",
            { headers },
          );
          expect(res.status).toEqual(204);
        });
      });
    });
  },
});
