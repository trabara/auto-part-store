import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";
import { BaseController } from "@trabara/common";
import {
  CreatePermissionSchema,
  UpdatePermissionSchema,
} from "@trabara/core/validations";

export class PermissionController extends BaseController {
  async getById(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      const permission = await service.permissions.retrieve(id, {
        relations: ["category"],
      });

      this.success({ permission });
    });
  }

  async list(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);

      const [permissions, count] = await service.permissions.listAndCount({}, {
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });


      this.success({ data: permissions, metadata: { count } });
    });
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const validated = CreatePermissionSchema.parse(this.req.validatedBody);

      const [permission] = await service.permissions.create([validated]);

      this.created({ permission });
    });
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;
      const validated = UpdatePermissionSchema.parse(this.req.validatedBody);

      const [permission] = await service.permissions.update([
        { id, ...validated },
      ]);

      this.success({ permission });
    });
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      await service.permissions.delete([id]);

      this.noContent();
    });
  }
}
