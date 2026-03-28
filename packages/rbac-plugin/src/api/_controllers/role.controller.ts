import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { RBAC_MODULE, RbacModuleService } from "../../modules/rbac";
import {
  AssignRoleSchema,
  RoleFiltersSchema,
  UpdateRoleSchema
} from "../../modules/rbac/schema";

export class RoleController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const validated = RoleFiltersSchema.parse(this.req.query || {});

      const { data, metadata } = await query.graph({
        entity: "rbac_role",
        filters: validated,
        ...this.req.queryConfig,
      });

      this.success({ data, metadata });
    });
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<RbacModuleService>(RBAC_MODULE);
      // const validated = CreateRoleSchema.parse(this.req.validatedBody);

      this.logger.info("Creating new role", {
        data: this.req.validatedBody,
      });

      const role = await service.createRbacRoles({
        ...this.req.validatedBody as any,
      });

      this.logger.info("Role created successfully", {
        role_id: role.id,
      });
      this.created({ role });
    });
  }

  async get(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const { id } = this.req.params;

      const { data: roles } = await query.graph({
        entity: "rbac_role",
        fields: ["*"],
        filters: { id },
      });

      if (!roles.length) {
        this.notFound("Role not found");
        return;
      }

      this.success({ role: roles[0] });
    });
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<RbacModuleService>(RBAC_MODULE);
      const { id } = this.req.params;
      const validated = UpdateRoleSchema.parse(this.req.validatedBody);

      const role = await service.updateRbacRoles({ id, ...validated });

      if (!role) {
        this.notFound("Role not found");
        return;
      }

      this.success({ role });
    });
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<RbacModuleService>(RBAC_MODULE);
      const { id } = this.req.params;

      await service.deleteRbacRoles([id]);

      this.noContent();
    });
  }

  async assign(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<RbacModuleService>(RBAC_MODULE);
      const { id } = this.req.params;
      const validated = AssignRoleSchema.parse(this.req.validatedBody);

      const member = await service.assignRole(
        validated.user_id,
        id
      );

      this.success({ member });
    });
  }
}
