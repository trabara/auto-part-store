import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { AUTHZ_MODULE, AuthzModuleService } from "../../modules/authz";
import {
  CreatePermissionSchema,
  PermissionFiltersSchema,
} from "../../modules/authz/schema";

export class PermissionController extends BaseController {
  constructor(req, res) {
    super(req, res);
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

      this.success({ data, metadata });
    });
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const validated = CreatePermissionSchema.parse(this.req.validatedBody);

      const permission = await service.createAuthzPermissions({
        kind: validated.kind,
        target: validated.target,
        type: "custom",
        category_id: validated.category_id,
      });

      this.created({ permission });
    });
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      const result = await service.retrieveAuthzPermission(id);

      if (!result) {
        this.notFound("Permission not found");
        return;
      }

      if (result.type === "predefined") {
        this.res.status(400).json({
          message: "Cannot delete predefined permissions",
        });
        return;
      }

      await service.deleteAuthzPermissions([id]);

      this.noContent();
    });
  }
}
