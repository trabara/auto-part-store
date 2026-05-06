import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { MedusaContainer } from "@medusajs/framework/types";
import jwt from "jsonwebtoken";
import {
  ensureAdminAccess,
  createTestPermission,
  createTestRole,
  createTestCategory,
} from "../fixtures/rbac-seeders";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";

jest.setTimeout(90000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("GET /admin/rbac/v2/stats", () => {
      const headers: Record<string, string> = {};
      let container: MedusaContainer;

      beforeEach(async () => {
        container = getContainer();
        const authModuleService = container.resolve("auth");
        const userModuleService = container.resolve("user");

        const user = await userModuleService.createUsers({
          email: "test@test.com",
        });

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
        await expect(api.get("/admin/rbac/v2/stats")).rejects.toMatchObject({
          response: { status: 401 },
        });
      });

      it("should return 200 with stats object", async () => {
        const res = await api.get("/admin/rbac/v2/stats", { headers });

        expect(res.status).toEqual(200);
        expect(res.data).toHaveProperty("stats");
        expect(res.data.stats).toHaveProperty("roles");
        expect(res.data.stats).toHaveProperty("permissions");
        expect(res.data.stats).toHaveProperty("categories");
        expect(res.data.stats).toHaveProperty("members");
        expect(res.data.stats).toHaveProperty("policies");
      });

      it("should return numeric counts for all fields", async () => {
        const res = await api.get("/admin/rbac/v2/stats", { headers });

        const { stats } = res.data;
        expect(typeof stats.roles).toEqual("number");
        expect(typeof stats.permissions).toEqual("number");
        expect(typeof stats.categories).toEqual("number");
        expect(typeof stats.members).toEqual("number");
        expect(typeof stats.policies).toEqual("number");
      });

      it("should reflect seeded data in counts", async () => {
        const service = container.resolve(AUTHZ_MODULE) as AuthzModuleService;

        // Capture baseline counts
        const baseline = await api.get("/admin/rbac/v2/stats", { headers });
        const base = baseline.data.stats;

        // Seed 2 extra permissions
        const perm1 = await createTestPermission(container, {
          target: "/admin/stats-test-1",
        });
        const perm2 = await createTestPermission(container, {
          target: "/admin/stats-test-2",
        });

        // Seed 1 role with both permissions (creates 2 policies)
        const role = await createTestRole(container, [perm1.id, perm2.id], {
          name: "Stats Test Role",
        });

        // Seed 1 category
        await createTestCategory(container, {
          name: "Stats Test Category",
          permissions: [
            { kind: "read", target: "/admin/stats-cat", type: "custom" },
          ],
        });

        // Seed 1 member
        const userModuleService = container.resolve("user");
        const extraUser = await userModuleService.createUsers({
          email: "stats-member@test.com",
        });
        await service.createAuthzMembers([
          { user_id: extraUser.id, role_id: role.id },
        ]);

        const res = await api.get("/admin/rbac/v2/stats", { headers });
        const { stats } = res.data;

        // Roles: +1 (Stats Test Role); the seeder also creates one per beforeEach
        expect(stats.roles).toBeGreaterThanOrEqual(base.roles + 1);
        // Permissions: +2 (stats-test-1, stats-test-2) + 1 from category seeder
        expect(stats.permissions).toBeGreaterThanOrEqual(base.permissions + 2);
        // Categories: +1 (Stats Test Category)
        expect(stats.categories).toBeGreaterThanOrEqual(base.categories + 1);
        // Members: +1 (extraUser)
        expect(stats.members).toBeGreaterThanOrEqual(base.members + 1);
        // Policies: +2 (perm1 + perm2 attached to role)
        expect(stats.policies).toBeGreaterThanOrEqual(base.policies + 2);
      });
    });
  },
});
