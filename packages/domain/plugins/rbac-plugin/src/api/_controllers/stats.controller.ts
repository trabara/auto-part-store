import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";
import { BaseController } from "@trabara/common";

export class StatsController extends BaseController {
  async get(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve(
        AUTHZ_MODULE,
      ) as AuthzModuleService;
      const stats = await service.getStats();
      
      this.success({
        stats,
      });
    }, "Stats retrieved successfully");
  }
}
