import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { RBAC_MODULE, RbacModuleService } from "../../modules/rbac";
import {
  AssignUsersSchema,
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

      const role = await service.createRoles({
        name: validated.name,
        description: validated.description,
      });


      await service.createPolicies(validated.policies.map((policy) => ({
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
        ...this.req.queryConfig,
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
      const { id } = this.req.params;
      
      const validated = UpdateRoleSchema.parse(this.req.validatedBody);
      
      const service = this.req.scope.resolve<RbacModuleService>(RBAC_MODULE);

      const role = await service.updateRoles({ id, ...validated });

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

      this.logger.info(`Deleting role ${id}`, {
        role_id: id,
      });
      await service.deleteRoles([id]);

      this.noContent();
    }, "Role deleted successfully");
  }

  async assign(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<RbacModuleService>(RBAC_MODULE);
      const { id } = this.req.params;
      const validated = AssignUsersSchema.parse(this.req.validatedBody);

      const userIds = validated.users.map((user) => user.id);

      this.logger.info(`Assigning role ${id} to users`, {
        role_id: id,
        user_ids: userIds,
      });

      await service.assignUsers(id, userIds);

      this.noContent();
    }, "Role assigned successfully");
  }
}
