import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { AUTHZ_MODULE, AuthzModuleService } from "../../modules/authz";
import {
  CreatePermissionSchema,
  PermissionFiltersSchema,
  UpdatePermissionSchema,
} from "../../modules/authz/schema";

export class PermissionController extends BaseController {
  constructor(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
    super(req, res);
  }

  async get(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const { id } = this.req.params;

      const { data: [permission] } = await query.graph({
        entity: "authz_permission",
        filters: { id },
        ...this.req.queryConfig,
        ...this.req.filterableFields
      });

      if (!permission) {
        return this.notFound("Permission not found");
      }

      this.success({ permission }, 200);
    });
  }
  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const validated = PermissionFiltersSchema.parse(this.req.query || {});

      const { data, metadata } = await query.graph({
        entity: "authz_permission",
        filters: validated,
        ...this.req.queryConfig,
      });

      this.success({ data, metadata }, 200);
    });
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const validated = CreatePermissionSchema.parse(this.req.validatedBody);

      const permission = await service.createAuthzPermissions(validated);

      this.created({ permission });
    });
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;
      const validated = UpdatePermissionSchema.parse(this.req.validatedBody);

      const permission = await service.updateAuthzPermissions([{ id, ...validated }]);


      this.success({ permission }, 200);
    });
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      await service.deleteAuthzPermissions([id]);

      this.success({ success: true }, 204);
    });
  }
}
