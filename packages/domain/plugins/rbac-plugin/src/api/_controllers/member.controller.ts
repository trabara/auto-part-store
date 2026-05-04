import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";
import { BaseController } from "@trabara/common";

export class MemberController extends BaseController {
  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      const { data, metadata } = await query.graph({
        entity: "authz_member",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.success({ data, metadata });
    }, "Members retrieved successfully");
  }

  async getById(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      const [member] = await service.listAuthzMembers({ id });

      if (!member) {
        this.notFound("Member not found");
        return;
      }

      this.success({ member });
    }, "Member retrieved successfully");
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      await service.deleteAuthzMembers([id]);

      this.noContent();
    }, "Member deleted successfully");
  }
}
