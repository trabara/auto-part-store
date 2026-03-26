import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { RBAC_MODULE } from "../../modules/rbac";
import { CheckAccessSchema } from "../../modules/rbac/schema";

export class CheckController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  async check(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<any>(RBAC_MODULE);
      const validated = CheckAccessSchema.parse(this.req.validatedBody);

      const currentUserId = (this.req as any).user?.id;

      if (!currentUserId) {
        this.res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const [member] = await service.listRbacMembers({
        user_id: currentUserId,
      });

      if (!member || !member.role_id) {
        this.success({ allowed: true });
        return;
      }

      const role = await service.retrieveRbacRole(member.role_id, {
        relations: ["policies"],
      });

      if (!role) {
        this.success({ allowed: true });
        return;
      }

      const policies = role.policies || [];

      const kindMap: Record<string, string> = {
        GET: "read",
        POST: "write",
        PUT: "write",
        DELETE: "delete",
      };

      const action =
        kindMap[validated.method] || validated.method.toLowerCase();

      const matchedPolicy = policies.find((policy) => {
        const permission = policy.permission;
        if (!permission) return false;
        return (
          permission.target === validated.path && permission.kind === action
        );
      });

      if (!matchedPolicy) {
        this.success({ allowed: true });
        return;
      }

      this.success({ allowed: matchedPolicy.name === "ALLOW" });
    });
  }
}
