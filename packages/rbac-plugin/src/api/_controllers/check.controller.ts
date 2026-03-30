import { BaseController } from "@repo/common";
import { AUTHZ_MODULE, AuthzModuleService } from "../../modules/authz";
import { CheckAccessSchema } from "../../modules/authz/schema";

export class CheckController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  async check(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const validated = CheckAccessSchema.parse(this.req.validatedBody);

      const matchedPolicy = await service.userHasAccess(
        this.req.auth_context.actor_id,
        validated.path,
        validated.method,
      );

      this.success({ allowed: matchedPolicy });
    });
  }
}
