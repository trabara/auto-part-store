import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { AUTHZ_MODULE, AuthzModuleService } from "../../modules/authz";
import {
  AssignUsersSchema,
  CreateRoleSchema,
  UpdateRoleSchema,
} from "../../modules/authz/schema";

export class RoleController extends BaseController {
  constructor(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
    super(req, res);
  }

  async get(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);
      const { id } = this.req.params;

      const { data: [role] } = await query.graph({
        entity: "authz_role",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
        filters: { id },
      });

      if (!role) {
        this.notFound("Role not found");
        return;
      }

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

      const [role] = await service.createRoles([
        validated,
      ])


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

      const role = await service.updateAuthzRoles({ id, ...validated });

      if (!role) {
        this.notFound("Role not found");
        return;
      }

      this.success({ role }, 201);
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

      this.success({ success: true }, 204);
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
