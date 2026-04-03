import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils";
import { EXCLUDED_RESOURCES } from "../constant";
import * as Models from "../models";
import {
  AssignUsersInput,
  CategoryPermissionsResult,
  CreateCategoryInput,
  CreatePermissionInput,
  CreateRoleInput,
  Role,
} from "@trabara/core/dtos";

export default class AuthzModuleService extends MedusaService(Models) {
  public async userHasAccess(
    userId: string,
    resource: string,
    method: string,
  ): Promise<boolean> {
    if (this.isExcludedRoute(resource, method)) {
      return true;
    }

    const [member] = await this.listAuthzMembers({
      user_id: userId,
    });

    if (!member || !member.role_id) {
      return false;
    }

    const role = await this.retrieveAuthzRole(member.role_id, {
      relations: ["policies", "policies.permission"],
    });

    if (!role) {
      return false;
    }

    const action = this.methodToAction(method);
    return role.policies.some(({ permission }) => {
      if (permission.type === "predefined") {
        return (
          resource.includes(permission.target) && permission.kind === action
        );
      }
      // for custom policies, we can have more complex logic, for now we just check if the target matches
      return resource.includes(permission.target);
    });
  }

  @InjectManager()
  async createPermissionCategory(
    dto: CreateCategoryInput,
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<CategoryPermissionsResult> {
    return this.createPermissionCategory_(dto, sharedContext);
  }

  @InjectManager()
  async createPermissionCategories(
    dtos: CreateCategoryInput[],
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<CategoryPermissionsResult[]> {
    const categories: CategoryPermissionsResult[] = [];
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
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    for await (const categoryId of categoryIds) {
      await this.deletePermissionsByCategoryId_(categoryId, sharedContext);
    }
  }

  @InjectTransactionManager()
  async createPermissionCategory_(
    dto: CreateCategoryInput,
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<CategoryPermissionsResult> {
    const category = await this.createAuthzCategories(
      {
        name: dto.name,
        description: dto.description,
      },
      sharedContext,
    );

    const permsToCreate: CreatePermissionInput[] = dto.permissions.map((p) => ({
      kind: p.kind,
      target: p.target,
      type: p.type,
      category_id: category.id,
    }));

    const createdPermissions = await this.createAuthzPermissions(
      permsToCreate,
      sharedContext,
    );
    return {
      ...category,
      permissions: createdPermissions,
    };
  }

  @InjectTransactionManager()
  async deletePermissionsByCategoryId_(
    categoryId: string,
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    const permissions = await this.listAuthzPermissions(
      {
        category_id: categoryId,
      },
      {},
      sharedContext,
    );

    const permissionIds = permissions.map((p) => p.id);
    if (permissionIds.length) {
      await this.deleteAuthzPermissions(
        {
          id: permissionIds,
        },
        sharedContext,
      );
    }
  }

  @InjectManager()
  async createRoles(
    inputs: CreateRoleInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Role[]> {
    const roles: Role[] = [];
    for (const input of inputs) {
      const role = await this.createRole_(input, sharedContext);
      roles.push(role);
    }
    return roles;
  }

  @InjectTransactionManager()
  async createRole_(
    input: CreateRoleInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Role> {
    const role = await this.createAuthzRoles(
      {
        name: input.name,
        description: input.description,
      },
      sharedContext,
    );

    await this.createAuthzPolicies(
      input.permissions.map((permission_id) => ({
        role_id: role.id,
        permission_id,
      })),
      sharedContext,
    );

    return role;
  }

  @InjectManager()
  public async assignRbacUsers(
    roleId: string,
    input: AssignUsersInput,
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    await this.assignRbacUsers_(roleId, input.userIds, sharedContext);
  }

  @InjectTransactionManager()
  protected async assignRbacUsers_(
    roleId: string,
    userIds: string[],
    @MedusaContext()
    sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    //if userIds is empty, we should still remove all existing members from the role
    if (userIds.length === 0) {
      await this.deleteAuthzMembers(
        {
          role_id: roleId,
        },
        sharedContext,
      );
    }

    const membersResult = await this.listAuthzMembers(
      {
        user_id: userIds,
      },
      {},
      sharedContext,
    );

    let member;
    for (const userId of userIds) {
      member = membersResult.find((m) => m.user_id === userId);

      if (member) {
        await this.updateAuthzMembers(
          [
            {
              id: member.id,
              role_id: roleId,
            },
          ],
          sharedContext,
        );
      } else {
        await this.createAuthzMembers(
          [
            {
              user_id: userId,
              role_id: roleId,
            },
          ],
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
      return path.includes(route.target);
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
