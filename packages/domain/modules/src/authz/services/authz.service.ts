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
import { BaseModuleService } from "../../shared/base-module.service";

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

// ============================================================================
// Sub-service: AuthzRole
// ============================================================================

class AuthzRoleCrudService extends BaseModuleService<AuthzRole> {
  constructor(
    repo: DAL.RepositoryService<AuthzRole>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "AuthzRole");
  }
}

// ============================================================================
// Sub-service: AuthzPermission
// ============================================================================

class AuthzPermissionCrudService extends BaseModuleService<AuthzPermission> {
  constructor(
    repo: DAL.RepositoryService<AuthzPermission>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "AuthzPermission");
  }
}

// ============================================================================
// Sub-service: AuthzPolicy  (no update / retrieve — list, create, delete only)
// ============================================================================

class AuthzPolicyCrudService extends BaseModuleService<AuthzPolicy> {
  constructor(
    repo: DAL.RepositoryService<AuthzPolicy>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "AuthzPolicy");
  }
}

// ============================================================================
// Sub-service: AuthzMember  (custom delete that accepts Record<string, any>)
// ============================================================================

class AuthzMemberCrudService extends BaseModuleService<AuthzMember> {
  constructor(
    repo: DAL.RepositoryService<AuthzMember>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "AuthzMember");
  }

  // Override delete to accept flexible filter objects (e.g. { role_id: ... })
  override async delete(
    ids: string | string[] | Record<string, any>,
    ctx?: Context<EntityManager>,
  ): Promise<void> {
    await (this.repository_ as any).delete(ids as any, ctx);
  }
}

// ============================================================================
// Sub-service: AuthzCategory
// ============================================================================

class AuthzCategoryCrudService extends BaseModuleService<AuthzCategory> {
  constructor(
    repo: DAL.RepositoryService<AuthzCategory>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "AuthzCategory");
  }
}

// ============================================================================
// Main service
// ============================================================================

export default class AuthzModuleService implements IAuthzModuleService {
  readonly roles: AuthzRoleCrudService;
  readonly permissions: AuthzPermissionCrudService;
  readonly policies: AuthzPolicyCrudService;
  readonly members: AuthzMemberCrudService;
  readonly categories: AuthzCategoryCrudService;

  // Required by @InjectManager() — must be named baseRepository_
  protected baseRepository_: DAL.RepositoryService<any>;
  protected authzRoleRepository_: DAL.RepositoryService<AuthzRole>;
  protected authzPermissionRepository_: DAL.RepositoryService<AuthzPermission>;
  protected authzPolicyRepository_: DAL.RepositoryService<AuthzPolicy>;
  protected authzMemberRepository_: DAL.RepositoryService<AuthzMember>;
  protected authzCategoryRepository_: DAL.RepositoryService<AuthzCategory>;

  constructor(dependencies: InjectedDependencies) {
    this.baseRepository_ = dependencies.baseRepository;
    this.authzRoleRepository_ = dependencies.authzRoleRepository;
    this.authzPermissionRepository_ = dependencies.authzPermissionRepository;
    this.authzPolicyRepository_ = dependencies.authzPolicyRepository;
    this.authzMemberRepository_ = dependencies.authzMemberRepository;
    this.authzCategoryRepository_ = dependencies.authzCategoryRepository;

    this.roles = new AuthzRoleCrudService(
      dependencies.authzRoleRepository,
      dependencies.baseRepository,
    );
    this.permissions = new AuthzPermissionCrudService(
      dependencies.authzPermissionRepository,
      dependencies.baseRepository,
    );
    this.policies = new AuthzPolicyCrudService(
      dependencies.authzPolicyRepository,
      dependencies.baseRepository,
    );
    this.members = new AuthzMemberCrudService(
      dependencies.authzMemberRepository,
      dependencies.baseRepository,
    );
    this.categories = new AuthzCategoryCrudService(
      dependencies.authzCategoryRepository,
      dependencies.baseRepository,
    );
  }

  // ============================================================================
  // Remote Query joiner delegate methods
  //
  // Medusa's joiner config derives method names from entity names via the
  // convention: `list<PluralEntityName>` / `listAndCount<PluralEntityName>`.
  // These thin wrappers forward to the namespace accessor sub-services so
  // that `query.graph({ entity: "authz_role" })` continues to work.
  // ============================================================================

  @InjectManager()
  async listAuthzRoles(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzRole[]> {
    return this.roles.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountAuthzRoles(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzRole[], number]> {
    return this.roles.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listAuthzPermissions(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPermission[]> {
    return this.permissions.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountAuthzPermissions(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzPermission[], number]> {
    return this.permissions.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listAuthzPolicies(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzPolicy[]> {
    return this.policies.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountAuthzPolicies(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzPolicy[], number]> {
    return this.policies.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listAuthzMembers(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    return this.members.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountAuthzMembers(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzMember[], number]> {
    return this.members.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listAuthzCategories(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<AuthzCategory[]> {
    return this.categories.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountAuthzCategories(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[AuthzCategory[], number]> {
    return this.categories.listAndCount(filters, config, ctx);
  }

  // ============================================================================
  // Write delegates for permissions and members
  // (needed for seeders and external callers that have no ctx)
  // ============================================================================

  @InjectManager()
  async createPermissions(
    data: any[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<AuthzPermission[]> {
    return this.createPermissions_(data, sharedContext);
  }

  @InjectTransactionManager()
  private async createPermissions_(
    data: any[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<AuthzPermission[]> {
    return this.authzPermissionRepository_.create(data, sharedContext);
  }

  @InjectManager()
  async createMembers(
    data: any[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    return this.createMembers_(data, sharedContext);
  }

  @InjectTransactionManager()
  private async createMembers_(
    data: any[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    return this.authzMemberRepository_.create(data, sharedContext);
  }

  @InjectManager()
  async updateMembers(
    data: (Record<string, any> & { id: string })[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    return this.updateMembers_(data, sharedContext);
  }

  @InjectTransactionManager()
  private async updateMembers_(
    data: (Record<string, any> & { id: string })[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<AuthzMember[]> {
    const ids = data.map((d) => d.id);
    const entities = await this.authzMemberRepository_.find(
      { where: { id: { $in: ids } } } as any,
      sharedContext,
    );
    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const pairs = data
      .filter((d) => entityMap.has(d.id))
      .map(({ id, ...update }) => ({ entity: entityMap.get(id)!, update }));
    return this.authzMemberRepository_.update(pairs as any, sharedContext);
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

    const [member] = await this.members.list({ user_id: userId });

    if (!member || !member.role_id) {
      return false;
    }

    const role = await this.roles.retrieve(member.role_id, {
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
    const [category] = await this.categories.create(
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

    const createdPermissions = await this.permissions.create(
      permsToCreate,
      sharedContext,
    );
    return {
      ...category,
      permissions: createdPermissions,
    } as any as CategoryPermissionsResult;
  }

  @InjectTransactionManager()
  private async deletePermissionsByCategoryId_(
    categoryId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<void> {
    const perms = await this.permissions.list(
      { category_id: categoryId },
      {},
      sharedContext,
    );

    const permissionIds = perms.map((p) => p.id);
    if (permissionIds.length) {
      await this.permissions.delete(permissionIds, sharedContext);
    }
  }

  @InjectManager()
  async createRoles(
    inputs: CreateRoleInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Role[]> {
    const rolesList: Role[] = [];
    for (const input of inputs) {
      const role = await this.createRole_(input, sharedContext);
      rolesList.push(role);
    }
    return rolesList;
  }

  @InjectTransactionManager()
  private async createRole_(
    input: CreateRoleInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Role> {
    const [role] = await this.roles.create(
      [{ name: input.name, description: input.description }],
      sharedContext,
    );

    await this.policies.create(
      input.permissions.map((permission_id) => ({
        role_id: role.id,
        permission_id,
      })),
      sharedContext,
    );

    return role as any as Role;
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
    const existingPolicies = await this.policies.list(
      { role_id: roleId },
      {},
      sharedContext,
    );

    if (existingPolicies.length > 0) {
      await this.policies.delete(
        existingPolicies.map((p) => p.id),
        sharedContext,
      );
    }

    if (permissionIds.length > 0) {
      await this.policies.create(
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
      await this.members.delete({ role_id: roleId }, sharedContext);
      return;
    }

    const membersResult = await this.members.list(
      { user_id: userIds },
      {},
      sharedContext,
    );

    let member;
    for (const userId of userIds) {
      member = membersResult.find((m) => m.user_id === userId);

      if (member) {
        await this.members.update(
          [{ id: member.id, role_id: roleId }],
          sharedContext,
        );
      } else {
        await this.members.create(
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
