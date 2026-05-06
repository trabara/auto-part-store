import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService
} from "@medusajs/framework/utils";
import {
  AssignUsersInput,
  Category,
  CreateCategoryInput,
  CreatePermissionInput,
  CreateRoleInput
} from "@trabara/core/dtos";
import { EXCLUDED_RESOURCES } from "../constant";
import * as Models from "../models";

type IStatsResult = {
  roles: number;
  permissions: number;
  categories: number;
  members: number;
  policies: number;
};

export default class AuthzModuleService extends MedusaService(Models) {

  async createRolesWithPermissions(dto: CreateRoleInput[], @MedusaContext() sharedContext?: Context<EntityManager>): Promise<Models.AuthzRole[]> {
    return this.createRolesWithPermissions_(dto, sharedContext);
  }

  @InjectTransactionManager()
  async createRolesWithPermissions_(dto: CreateRoleInput[], @MedusaContext() sharedContext?: Context<EntityManager>): Promise<Models.AuthzRole[]> {
    const createdRoles: Models.AuthzRole[] = [];
    for await (const roleDto of dto) {
      const { name, description, permissions } = roleDto;
      const [role] = await this.createAuthzRoles([{ name, description }], sharedContext);
      createdRoles.push(role);

      if (permissions && permissions.length > 0) {
        await this.createAuthzPolicies(
          permissions.map((permission_id) => ({
            role_id: role.id,
            permission_id,
          })),
          sharedContext,
        );
      }
    }
    return createdRoles;
  }

  @InjectManager()
  async getStats(@MedusaContext() sharedContext?: Context<EntityManager>): Promise<IStatsResult> {
    return this.getStats_(sharedContext);
  }

  @InjectTransactionManager()
  async getStats_(
    @MedusaContext()
    ctx?: Context<EntityManager>,
  ): Promise<IStatsResult> {
    const [
      [, roles],
      [, permissions],
      [, categories],
      [, members],
      [, policies],
    ] = await Promise.all([
      this.listAndCountAuthzRoles({}, {}, ctx),
      this.listAndCountAuthzPermissions({}, {}, ctx),
      this.listAndCountAuthzCategories({}, {}, ctx),
      this.listAndCountAuthzMembers({}, {}, ctx),
      this.listAndCountAuthzPolicies({}, {}, ctx),
    ]);

    return {
      roles,
      permissions,
      categories,
      members,
      policies,
    };
  }

  @InjectManager()
  async userHasAccess(userId: string, resource: string, method: string): Promise<boolean> {
    return this.userHasAccess_(userId, resource, method);
  }

  @InjectTransactionManager()
  async userHasAccess_(
    userId: string,
    resource: string,
    method: string,
    @MedusaContext()
    ctx?: Context<EntityManager>,
  ): Promise<boolean> {
    if (this.isExcludedRoute(resource, method)) {
      return true;
    }

    const [member] = await this.listAuthzMembers({ user_id: userId }, {}, ctx);

    if (!member || !member.role.id) {
      return false;
    }

    const role = await this.retrieveAuthzMember(member.role.id, {}, ctx);
    if (!role) {
      return false;
    }

    const action = this.methodToAction(method);

    const policies = await this.listAuthzPolicies({ role_id: role.id }, { relations: ['permission'] }, ctx);

    return policies.some(({ permission }) => {
      if (permission.type === "predefined") {
        return (
          resource.includes(permission.target) && permission.kind === action
        );
      }
      return resource.includes(permission.target);
    });
  }

  @InjectManager()
  async createPermissionCategory(
    dto: CreateCategoryInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Category> {
    return this.createPermissionCategory_(dto, sharedContext);
  }

  @InjectManager()
  async createPermissionCategories(
    dtos: CreateCategoryInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Category[]> {
    const categories: Category[] = [];
    for await (const dto of dtos) {
      const categoryPermissions = await this.createPermissionCategory_(
        dto,
        sharedContext,
      );
      categories.push(categoryPermissions);
    }
    return categories;
  }

  @InjectManager()
  async deletePermissionsByCategoryIds(
    categoryIds: string[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    for await (const categoryId of categoryIds) {
      await this.deletePermissionsByCategoryId_(categoryId, sharedContext);
    }
  }

  @InjectTransactionManager()
  private async createPermissionCategory_(
    dto: CreateCategoryInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Category> {
    const [category] = await this.createAuthzCategories(
      [{ name: dto.name, description: dto.description }],
      sharedContext,
    );

    const permsToCreate: CreatePermissionInput[] = (dto.permissions ?? []).map(
      (p) => ({
        kind: p.kind,
        target: p.target,
        type: p.type,
        category_id: category.id,
      }),
    );

    const createdPermissions = await this.createAuthzPermissions(
      permsToCreate,
      sharedContext,
    );
    return {
      ...category,
      permissions: createdPermissions,
    } as any as Category;
  }

  @InjectTransactionManager()
  private async deletePermissionsByCategoryId_(
    categoryId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    const perms = await this.listAuthzPermissions(
      { category_id: categoryId },
      {},
      sharedContext,
    );

    const permissionIds = perms.map((p) => p.id);
    if (permissionIds.length) {
      await this.deleteAuthzPermissions(permissionIds, sharedContext);
    }
  }

  @InjectManager()
  async assignRbacUsers(
    roleId: string,
    input: AssignUsersInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    await this.assignRbacUsers_(roleId, input.userIds, sharedContext);
  }

  @InjectManager()
  async updateRolePolicies(
    roleId: string,
    permissionIds: string[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    await this.updateRolePolicies_(roleId, permissionIds, sharedContext);
  }

  @InjectTransactionManager()
  private async updateRolePolicies_(
    roleId: string,
    permissionIds: string[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    const existingPolicies = await this.listAuthzPolicies(
      { role_id: roleId },
      {},
      sharedContext,
    );

    if (existingPolicies.length > 0) {
      await this.deleteAuthzPolicies(
        existingPolicies.map((p) => p.id),
        sharedContext,
      );
    }

    if (permissionIds.length > 0) {
      await this.createAuthzPolicies(
        permissionIds.map((permission_id) => ({
          role_id: roleId,
          permission_id,
        })),
        sharedContext,
      );
    }
  }

  @InjectTransactionManager()
  private async assignRbacUsers_(
    roleId: string,
    userIds: string[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    if (userIds.length === 0) {
      await this.deleteAuthzMembers({ role_id: roleId }, sharedContext);
      return;
    }

    const membersResult = await this.listAuthzMembers(
      { user_id: userIds },
      {},
      sharedContext,
    );

    let member;
    for (const userId of userIds) {
      member = membersResult.find((m) => m.user_id === userId);

      if (member) {
        await this.updateAuthzMembers(
          [{ id: member.id, role_id: roleId }],
          sharedContext,
        );
      } else {
        await this.createAuthzMembers(
          [{ user_id: userId, role_id: roleId }],
          sharedContext,
        );
      }
    }
  }

  private isExcludedRoute(path: string, method: string): boolean {
    return EXCLUDED_RESOURCES.some((route) => {
      if (route.kind !== this.methodToAction(method)) {
        return false;
      }
      return path.startsWith(route.target);
    });
  }

  private methodToAction(method: string): string {
    const map: Record<string, string> = {
      GET: "read",
      POST: "write",
      PATCH: "write",
      PUT: "write",
      DELETE: "delete",
    };
    return map[method] || method.toLowerCase();
  }
}
