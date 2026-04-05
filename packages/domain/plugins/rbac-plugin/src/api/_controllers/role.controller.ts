import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@trabara/common";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";
import {
  AssignUsersSchema,
  CreateRoleSchema,
  UpdateRoleSchema,
} from "@trabara/core/validations";

export class RoleController extends BaseController {
  async getById(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      const role = await service.retrieveAuthzRole(id, {
        relations: ["policies", "policies.permission", "members"],
      });

      this.success({ role });
    }, "Role retrieved successfully");
  }

  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      this.logger.info("Fetching roles list", {
        filters: this.req.filterableFields,
        config: this.req.queryConfig,
      });

      const { data, metadata } = await query.graph({
        entity: "authz_role",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.logger.info(`Found ${data.length} roles`);

      this.success({ data, metadata });
    }, "Roles retrieved successfully");
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const validated = CreateRoleSchema.parse(this.req.validatedBody);

      this.logger.info("Creating new role", {
        data: validated,
      });

      const [role] = await service.createRoles([validated]);

      this.logger.info("Role created successfully", {
        role_id: role.id,
      });

      this.created({ role });
    }, "Role created successfully");
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;

      const validated = UpdateRoleSchema.parse(this.req.validatedBody);

      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);

      const [role] = await service.updateAuthzRoles([{ id, ...validated }]);

      if (!role) {
        this.notFound("Role not found");
        return;
      }

      this.success({ role });
    }, "Role updated successfully");
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      this.logger.info(`Deleting role ${id}`, {
        role_id: id,
      });
      await service.deleteAuthzRoles([id]);

      this.noContent();
    }, "Role deleted successfully");
  }

  async assign(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;
      const validated = AssignUsersSchema.parse(this.req.validatedBody);

      this.logger.info(`Assigning role ${id} to users`, {
        role_id: id,
        users: validated.userIds.length,
      });

      await service.assignRbacUsers(id, validated);

      this.success({ success: true }, 201);
    }, "Role assigned successfully");
  }
}
