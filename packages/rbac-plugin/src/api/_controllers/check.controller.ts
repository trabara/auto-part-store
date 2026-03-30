import { BaseController } from "@repo/common";
import { RBAC_V2_MODULE, RbacV2ModuleService } from "../../modules/rbac";
import { CheckAccessSchema } from "../../modules/rbac/schema";

export class CheckController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  async check(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<RbacV2ModuleService>(RBAC_V2_MODULE);
      const validated = CheckAccessSchema.parse(this.req.validatedBody);

      const matchedPolicy = await service.userHasAccess(
        this.req.auth_context.actor_id,
        validated.path,
        validated.method,
      )

      this.success({ allowed: matchedPolicy });
    });
  }
}
