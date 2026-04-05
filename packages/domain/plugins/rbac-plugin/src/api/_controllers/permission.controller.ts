import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@trabara/common";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";
import {
  CreatePermissionSchema,
  UpdatePermissionSchema,
} from "@trabara/core/validations";

export class PermissionController extends BaseController {
  async getById(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      const permission = await service.retrieveAuthzPermission(id, {
        relations: ["category"],
      });

      this.success({ permission });
    });
  }

  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      const { data, metadata } = await query.graph({
        entity: "authz_permission",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.success({ data, metadata });
    });
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const validated = CreatePermissionSchema.parse(this.req.validatedBody);

      const [permission] = await service.createAuthzPermissions([validated]);

      this.created({ permission });
    });
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;
      const validated = UpdatePermissionSchema.parse(this.req.validatedBody);

      const [permission] = await service.updateAuthzPermissions([
        { id, ...validated },
      ]);

      this.success({ permission });
    });
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      await service.deleteAuthzPermissions([id]);

      this.noContent();
    });
  }
}
