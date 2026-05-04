import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";
import { BaseController } from "@trabara/common";
import {
  CreatePermissionSchema,
  UpdatePermissionSchema,
} from "@trabara/core/validations";

export class PermissionController extends BaseController {
  async getById(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;

      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const permission = await service.retrieveAuthzPermission(id, {
        relations: ["category"],
      });

      this.success({ permission });
    }, "Permission retrieved successfully");
  }

  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve("query");

      const { data, metadata } = await query.graph({
        entity: 'authz_permission',
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });


      this.success({ data, metadata });
    }, "Permissions retrieved successfully");
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const validated = CreatePermissionSchema.parse(this.req.validatedBody);

      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const [permission] = await service.createAuthzPermissions([validated]);

      this.created({ permission });
    }, "Permission created successfully");
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;
      const validated = UpdatePermissionSchema.parse(this.req.validatedBody);

      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const [permission] = await service.updateAuthzPermissions([{ id, ...validated }]);

      this.success({ permission });
    }, "Permission updated successfully");
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;

      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      await service.deleteAuthzPermissions([id]);

      this.noContent();
    }, "Permission deleted successfully");
  }
}
