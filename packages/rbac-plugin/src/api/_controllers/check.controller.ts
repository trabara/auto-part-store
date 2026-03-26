import { BaseController } from "@repo/common";
import { RBAC_MODULE, RbacModuleService } from "../../modules/rbac";
import { CheckAccessSchema } from "../../modules/rbac/schema";

export class CheckController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  async check(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<RbacModuleService>(RBAC_MODULE);
      const validated = CheckAccessSchema.parse(this.req.validatedBody);

      const matchedPolicy = await service.hasAccess(
        this.req.auth_context.actor_id,
        validated.path,
        validated.method,
      )

      this.success({ allowed: matchedPolicy });
    });
  }
}
