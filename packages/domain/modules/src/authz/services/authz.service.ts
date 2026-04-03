import { Context, DAL, InferTypeOf } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
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
import type { IAuthzModuleService } from "@trabara/core/interfaces";

type AuthzRole = InferTypeOf<typeof Models.AuthzRole>;
type AuthzPermission = InferTypeOf<typeof Models.AuthzPermission>;
type AuthzPolicy = InferTypeOf<typeof Models.AuthzPolicy>;
type AuthzMember = InferTypeOf<typeof Models.AuthzMember>;
type AuthzCategory = InferTypeOf<typeof Models.AuthzCategory>;

type InjectedDependencies = {
  authzRoleRepository: DAL.RepositoryService<AuthzRole>;
  authzPermissionRepository: DAL.RepositoryService<AuthzPermission>;
  authzPolicyRepository: DAL.RepositoryService<AuthzPolicy>;
  authzMemberRepository: DAL.RepositoryService<AuthzMember>;
  authzCategoryRepository: DAL.RepositoryService<AuthzCategory>;
  baseRepository: DAL.RepositoryService<any>;
};

export default class AuthzModuleService implements IAuthzModuleService {
  protected authzRoleRepository_: DAL.RepositoryService<AuthzRole>;
  protected authzPermissionRepository_: DAL.RepositoryService<AuthzPermission>;
  protected authzPolicyRepository_: DAL.RepositoryService<AuthzPolicy>;
  protected authzMemberRepository_: DAL.RepositoryService<AuthzMember>;
  protected authzCategoryRepository_: DAL.RepositoryService<AuthzCategory>;
  protected baseRepository_: DAL.RepositoryService<any>;

  constructor(dependencies: InjectedDependencies) {
    this.authzRoleRepository_ = dependencies.authzRoleRepository;
    this.authzPermissionRepository_ = dependencies.authzPermissionRepository;
    this.authzPolicyRepository_ = dependencies.authzPolicyRepository;
    this.authzMemberRepository_ = dependencies.authzMemberRepository;
    this.authzCategoryRepository_ = dependencies.authzCategoryRepository;
    this.baseRepository_ = dependencies.baseRepository;
  }

  // ============================================================================
  // AuthzRole CRUD
  // ============================================================================

  @InjectManager()
  async listAuthzRoles(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzRole[]> {
    return this.listAuthzRoles_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAuthzRoles_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzRole[]> {
    return this.authzRoleRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountAuthzRoles(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzRole[], number]> {
    return this.listAndCountAuthzRoles_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountAuthzRoles_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzRole[], number]> {
    return this.authzRoleRepository_.findAndCount(
      { where: filters ?? {} },
      ctx,
    );
  }

  @InjectManager()
  async retrieveAuthzRole(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzRole> {
    return this.retrieveAuthzRole_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveAuthzRole_(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzRole> {
    const options: any = { where: { id } };
    if (config?.relations) {
      options.options = { populate: config.relations };
    }
    const [role] = await this.authzRoleRepository_.find(options, ctx);
    if (!role) throw new Error(`AuthzRole with id ${id} not found`);
    return role;
  }

  @InjectManager()
  async createAuthzRoles(
    data: any | any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<any> {
    return this.createAuthzRoles_(data, ctx);
  }

  @InjectTransactionManager()
  private async createAuthzRoles_(
    data: any | any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<any> {
    const arr = Array.isArray(data) ? data : [data];
    const result = await this.authzRoleRepository_.create(arr, ctx);
    return Array.isArray(data) ? result : result[0];
  }

  @InjectManager()
  async updateAuthzRoles(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzRole[]> {
    return this.updateAuthzRoles_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateAuthzRoles_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzRole[]> {
    return this.authzRoleRepository_.update(data, ctx);
  }

  @InjectManager()
  async deleteAuthzRoles(
    ids: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteAuthzRoles_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteAuthzRoles_(
    ids: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    await this.authzRoleRepository_.delete(ids, ctx);
  }

  // ============================================================================
  // AuthzPermission CRUD
  // ============================================================================

  @InjectManager()
  async listAuthzPermissions(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPermission[]> {
    return this.listAuthzPermissions_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAuthzPermissions_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPermission[]> {
    return this.authzPermissionRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountAuthzPermissions(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzPermission[], number]> {
    return this.listAndCountAuthzPermissions_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountAuthzPermissions_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzPermission[], number]> {
    return this.authzPermissionRepository_.findAndCount(
      { where: filters ?? {} },
      ctx,
    );
  }

  @InjectManager()
  async retrieveAuthzPermission(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPermission> {
    return this.retrieveAuthzPermission_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveAuthzPermission_(
    id: string,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPermission> {
    const [perm] = await this.authzPermissionRepository_.find(
      { where: { id } },
      ctx,
    );
    if (!perm) throw new Error(`AuthzPermission with id ${id} not found`);
    return perm;
  }

  @InjectManager()
  async createAuthzPermissions(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPermission[]> {
    return this.createAuthzPermissions_(data, ctx);
  }

  @InjectTransactionManager()
  private async createAuthzPermissions_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPermission[]> {
    return this.authzPermissionRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateAuthzPermissions(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPermission[]> {
    return this.updateAuthzPermissions_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateAuthzPermissions_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPermission[]> {
    return this.authzPermissionRepository_.update(data, ctx);
  }

  @InjectManager()
  async deleteAuthzPermissions(
    ids: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteAuthzPermissions_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteAuthzPermissions_(
    ids: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    await this.authzPermissionRepository_.delete(ids, ctx);
  }

  // ============================================================================
  // AuthzPolicy CRUD
  // ============================================================================

  @InjectManager()
  async listAuthzPolicies(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPolicy[]> {
    return this.listAuthzPolicies_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAuthzPolicies_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPolicy[]> {
    return this.authzPolicyRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountAuthzPolicies(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzPolicy[], number]> {
    return this.listAndCountAuthzPolicies_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountAuthzPolicies_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzPolicy[], number]> {
    return this.authzPolicyRepository_.findAndCount(
      { where: filters ?? {} },
      ctx,
    );
  }

  @InjectManager()
  async createAuthzPolicies(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPolicy[]> {
    return this.createAuthzPolicies_(data, ctx);
  }

  @InjectTransactionManager()
  private async createAuthzPolicies_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPolicy[]> {
    return this.authzPolicyRepository_.create(data, ctx);
  }

  @InjectManager()
  async deleteAuthzPolicies(
    ids: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteAuthzPolicies_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteAuthzPolicies_(
    ids: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    await this.authzPolicyRepository_.delete(ids, ctx);
  }

  // ============================================================================
  // AuthzMember CRUD
  // ============================================================================

  @InjectManager()
  async listAuthzMembers(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    return this.listAuthzMembers_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAuthzMembers_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    return this.authzMemberRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountAuthzMembers(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzMember[], number]> {
    return this.listAndCountAuthzMembers_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountAuthzMembers_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzMember[], number]> {
    return this.authzMemberRepository_.findAndCount(
      { where: filters ?? {} },
      ctx,
    );
  }

  @InjectManager()
  async createAuthzMembers(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    return this.createAuthzMembers_(data, ctx);
  }

  @InjectTransactionManager()
  private async createAuthzMembers_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    return this.authzMemberRepository_.create(data, ctx);
  }

  @InjectManager()
  async updateAuthzMembers(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    return this.updateAuthzMembers_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateAuthzMembers_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    return this.authzMemberRepository_.update(data, ctx);
  }

  @InjectManager()
  async deleteAuthzMembers(
    ids: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteAuthzMembers_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteAuthzMembers_(
    ids: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    await this.authzMemberRepository_.delete(ids, ctx);
  }

  // ============================================================================
  // AuthzCategory CRUD
  // ============================================================================

  @InjectManager()
  async listAuthzCategories(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzCategory[]> {
    return this.listAuthzCategories_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAuthzCategories_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzCategory[]> {
    return this.authzCategoryRepository_.find({ where: filters ?? {} }, ctx);
  }

  @InjectManager()
  async listAndCountAuthzCategories(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzCategory[], number]> {
    return this.listAndCountAuthzCategories_(filters, config, ctx);
  }

  @InjectTransactionManager()
  private async listAndCountAuthzCategories_(
    filters?: Record<string, any>,
    _config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzCategory[], number]> {
    return this.authzCategoryRepository_.findAndCount(
      { where: filters ?? {} },
      ctx,
    );
  }

  @InjectManager()
  async createAuthzCategories(
    data: any | any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<any> {
    return this.createAuthzCategories_(data, ctx);
  }

  @InjectTransactionManager()
  private async createAuthzCategories_(
    data: any | any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<any> {
    const arr = Array.isArray(data) ? data : [data];
    const result = await this.authzCategoryRepository_.create(arr, ctx);
    return Array.isArray(data) ? result : result[0];
  }

  @InjectManager()
  async retrieveAuthzCategory(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzCategory> {
    return this.retrieveAuthzCategory_(id, config, ctx);
  }

  @InjectTransactionManager()
  private async retrieveAuthzCategory_(
    id: string,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzCategory> {
    const options: any = { where: { id } };
    if (config?.relations) {
      options.options = { populate: config.relations };
    }
    const [category] = await this.authzCategoryRepository_.find(options, ctx);
    if (!category) throw new Error(`AuthzCategory with id ${id} not found`);
    return category;
  }

  @InjectManager()
  async updateAuthzCategories(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzCategory[]> {
    return this.updateAuthzCategories_(data, ctx);
  }

  @InjectTransactionManager()
  private async updateAuthzCategories_(
    data: any[],
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzCategory[]> {
    return this.authzCategoryRepository_.update(data, ctx);
  }

  @InjectManager()
  async deleteAuthzCategories(
    ids: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    return this.deleteAuthzCategories_(ids, ctx);
  }

  @InjectTransactionManager()
  private async deleteAuthzCategories_(
    ids: any,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<void> {
    await this.authzCategoryRepository_.delete(ids, ctx);
  }

  // ============================================================================
  // Custom methods
  // ============================================================================

  async userHasAccess(
    userId: string,
    resource: string,
    method: string,
  ): Promise<boolean> {
    if (this.isExcludedRoute(resource, method)) {
      return true;
    }

    const [member] = await this.listAuthzMembers({ user_id: userId });

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
    const policies = Array.isArray(role.policies)
      ? role.policies
      : ((role.policies as any).getItems?.() ?? []);
    return policies.some(({ permission }: any) => {
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
  ): Promise<CategoryPermissionsResult> {
    return this.createPermissionCategory_(dto, sharedContext);
  }

  @InjectManager()
  async createPermissionCategories(
    dtos: CreateCategoryInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
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
  private async deletePermissionsByCategoryId_(
    categoryId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    const permissions = await this.listAuthzPermissions(
      { category_id: categoryId },
      {},
      sharedContext,
    );

    const permissionIds = permissions.map((p) => p.id);
    if (permissionIds.length) {
      await this.deleteAuthzPermissions({ id: permissionIds }, sharedContext);
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
  private async createRole_(
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
  async assignRbacUsers(
    roleId: string,
    input: AssignUsersInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    await this.assignRbacUsers_(roleId, input.userIds, sharedContext);
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
