import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { RBAC_MODULE } from "../../modules/rbac";
import { PermissionFiltersSchema, CreatePermissionSchema } from "../../modules/rbac/schema";

export class PermissionController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const validated = PermissionFiltersSchema.parse(this.req.query || {});

      const { data, metadata } = await query.graph({
        entity: "rbac_permission",
        filters: validated,
        ...this.req.queryConfig,
      });

      this.success({ permissions: data, metadata });
    });
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<any>(RBAC_MODULE);
      const validated = CreatePermissionSchema.parse(this.req.validatedBody);

      const permission = await service.createRbacPermissions({
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
      const service = this.req.scope.resolve<any>(RBAC_MODULE);
      const { id } = this.req.params;

      const [permission] = await service.listRbacPermissions({ id });

      if (!permission) {
        this.notFound("Permission not found");
        return;
      }

      if (permission.type === "predefined") {
        this.res.status(400).json({
          message: "Cannot delete predefined permissions",
        });
        return;
      }

      await service.deleteRbacPermissions([id]);

      this.noContent();
    });
  }
}
