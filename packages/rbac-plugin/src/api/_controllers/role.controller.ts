import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import { RBAC_MODULE } from "../../modules/rbac";
import {
  RoleFiltersSchema,
  CreateRoleSchema,
  UpdateRoleSchema,
  AssignRoleSchema,
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

      this.success({ roles: data, metadata });
    });
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<any>(RBAC_MODULE);
      const validated = CreateRoleSchema.parse(this.req.validatedBody);

      const role = await service.createRbacRoles({
        name: validated.name,
        description: validated.description,
        is_default: validated.is_default,
      });

      if (validated.policies?.length) {
        const policies = await service.createRbacPolicies(
          validated.policies.map((p) => ({
            ...p,
            role_id: role.id,
          })),
        );
        this.created({ role, policies });
      } else {
        this.created({ role, policies: [] });
      }
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

      const role = roles[0];

      const { data: policies } = await query.graph({
        entity: "rbac_policy",
        fields: ["*"],
        filters: { role_id: id },
      });

      this.success({ role, policies });
    });
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<any>(RBAC_MODULE);
      const { id } = this.req.params;
      const validated = UpdateRoleSchema.parse(this.req.validatedBody);

      const [role] = await service.updateRbacRoles(id, validated);

      if (!role) {
        this.notFound("Role not found");
        return;
      }

      this.success({ role });
    });
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<any>(RBAC_MODULE);
      const { id } = this.req.params;

      await service.deleteRbacRoles([id]);

      this.noContent();
    });
  }

  async assign(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<any>(RBAC_MODULE);
      const { id } = this.req.params;
      const validated = AssignRoleSchema.parse(this.req.validatedBody);

      const [existingMembers] = await service.listAndCountRbacMembers({
        user_id: validated.user_id,
      });

      let member;
      if (existingMembers.length > 0) {
        member = existingMembers[0];
        await service.updateRbacMembers(member.id, { role_id: id });
      } else {
        member = await service.createRbacMembers({
          user_id: validated.user_id,
          role_id: id,
        });
      }

      this.success({ member });
    });
  }
}
