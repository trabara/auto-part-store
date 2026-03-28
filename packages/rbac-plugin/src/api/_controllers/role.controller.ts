import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { RBAC_MODULE, RbacModuleService } from "../../modules/rbac";
import {
  AssignRoleSchema,
  CreateRoleSchema,
  UpdateRoleSchema
} from "../../modules/rbac/schema";

export class RoleController extends BaseController {
  constructor(req, res) {
    super(req, res);
  }

  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
      console.log("this.req.filterableFields", this.req.filterableFields);
      console.log("this.req.queryConfig", this.req.queryConfig);
      
      this.logger.info("Fetching roles list", {
        filters: this.req.filterableFields,
        config: this.req.queryConfig,
      });

      const { data, metadata } = await query.graph({
        entity: "rbac_role",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.logger.info(`Found ${data.length} roles`);

      this.success({ data, metadata });
    }, "Roles retrieved successfully");
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<RbacModuleService>(RBAC_MODULE);
      const validated = CreateRoleSchema.parse(this.req.validatedBody);

      this.logger.info("Creating new role", {
        data: validated,
      });

      const role = await service.createRbacRoles({
        name: validated.name,
        description: validated.description,
        is_default: validated.is_default,
      });


      await service.createRbacPolicies(validated.policies.map((policy) => ({
        name: policy.name,
        permission_id: policy.permission_id,
        role_id: role.id,
      })));

      this.logger.info("Role created successfully", {
        role_id: role.id,
      });

      this.created({ role });
    }, "Role created successfully");
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
    }, "Role retrieved successfully");
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
    }, "Role updated successfully");
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<RbacModuleService>(RBAC_MODULE);
      const { id } = this.req.params;

      await service.deleteRbacRoles([id]);

      this.noContent();
    }, "Role deleted successfully");
  }

  async assign(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<RbacModuleService>(RBAC_MODULE);
      const { id } = this.req.params;
      const validated = AssignRoleSchema.parse(this.req.validatedBody);

      const member = await service.assignRole(validated.user_id, id);

      this.success({ member });
    }, "Role assigned successfully");
  }
}
