import { BaseController } from "@trabara/common";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";

export class StatsController extends BaseController {
  async get(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve(
        AUTHZ_MODULE,
      ) as AuthzModuleService;

      const [
        [, roles],
        [, permissions],
        [, categories],
        [, members],
        [, policies],
      ] = await Promise.all([
        service.listAndCountAuthzRoles({}, {}),
        service.listAndCountAuthzPermissions({}, {}),
        service.listAndCountAuthzCategories({}, {}),
        service.listAndCountAuthzMembers({}, {}),
        service.listAndCountAuthzPolicies({}, {}),
      ]);

      this.success({
        stats: { roles, permissions, categories, members, policies },
      });
    }, "Stats retrieved successfully");
  }
}
