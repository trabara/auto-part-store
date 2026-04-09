import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context, DAL } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import {
  AssignUsersInput,
  Category,
  CreateCategoryInput,
  CreateMemberInput,
  CreatePermissionInput,
  CreateRoleInput,
  Member,
  Permission,
  Policy,
  Role,
  UpdateMemberInput
} from "@trabara/core/dtos";
import type { IAuthzModuleService } from "@trabara/core/interfaces";
import { EXCLUDED_RESOURCES } from "../constant";
import { AuthzCategoryCrudService } from "./category.service";
import { AuthzMemberCrudService } from "./member.service";
import { AuthzPermissionCrudService } from "./permission.service";
import { AuthzPolicyCrudService } from "./policy.service";
import { AuthzRoleCrudService } from "./role.service";

type InjectedDependencies = {
  authzRoleRepository: DAL.RepositoryService<Role>;
  authzPermissionRepository: DAL.RepositoryService<Permission>;
  authzPolicyRepository: DAL.RepositoryService<Policy>;
  authzMemberRepository: DAL.RepositoryService<Member>;
  authzCategoryRepository: DAL.RepositoryService<Category>;
  baseRepository: DAL.RepositoryService<any>;
};

export default class AuthzModuleService implements IAuthzModuleService {
  readonly roles: AuthzRoleCrudService;
  readonly permissions: AuthzPermissionCrudService;
  readonly policies: AuthzPolicyCrudService;
  readonly members: AuthzMemberCrudService;
  readonly categories: AuthzCategoryCrudService;

  // Required by @InjectManager() — must be named baseRepository_
  protected baseRepository_: DAL.RepositoryService<any>;
  protected authzRoleRepository_: DAL.RepositoryService<Role>;
  protected authzPermissionRepository_: DAL.RepositoryService<Permission>;
  protected authzPolicyRepository_: DAL.RepositoryService<Policy>;
  protected authzMemberRepository_: DAL.RepositoryService<Member>;
  protected authzCategoryRepository_: DAL.RepositoryService<Category>;

  constructor(deps: InjectedDependencies) {
    this.baseRepository_ = deps.baseRepository;
    this.authzRoleRepository_ = deps.authzRoleRepository;
    this.authzPermissionRepository_ = deps.authzPermissionRepository;
    this.authzPolicyRepository_ = deps.authzPolicyRepository;
    this.authzMemberRepository_ = deps.authzMemberRepository;
    this.authzCategoryRepository_ = deps.authzCategoryRepository;

    this.roles = new AuthzRoleCrudService(
      deps.authzRoleRepository,
      deps.baseRepository,
    );
    this.permissions = new AuthzPermissionCrudService(
      deps.authzPermissionRepository,
      deps.baseRepository,
    );
    this.policies = new AuthzPolicyCrudService(
      deps.authzPolicyRepository,
      deps.baseRepository,
    );
    this.members = new AuthzMemberCrudService(
      deps.authzMemberRepository,
      deps.baseRepository,
    );
    this.categories = new AuthzCategoryCrudService(
      deps.authzCategoryRepository,
      deps.baseRepository,
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
  ): Promise<Role[]> {
    return this.roles.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountAuthzRoles(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Role[], number]> {
    return this.roles.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listAuthzPermissions(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Permission[]> {
    return this.permissions.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountAuthzPermissions(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Permission[], number]> {
    return this.permissions.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listAuthzPolicies(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Policy[]> {
    return this.policies.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountAuthzPolicies(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Policy[], number]> {
    return this.policies.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listAuthzMembers(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Member[]> {
    return this.members.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountAuthzMembers(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Member[], number]> {
    return this.members.listAndCount(filters, config, ctx);
  }

  @InjectManager()
  async listAuthzCategories(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<Category[]> {
    return this.categories.list(filters, config, ctx);
  }

  @InjectManager()
  async listAndCountAuthzCategories(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<[Category[], number]> {
    return this.categories.listAndCount(filters, config, ctx);
  }

  // ============================================================================
  // Write delegates for permissions and members
  // (needed for seeders and external callers that have no ctx)
  // ============================================================================

  @InjectManager()
  async createPermissions(
    data: CreatePermissionInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Permission[]> {
    return this.createPermissions_(data, sharedContext);
  }

  @InjectTransactionManager()
  private async createPermissions_(
    data: CreatePermissionInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Permission[]> {
    return this.authzPermissionRepository_.create(data, sharedContext);
  }

  @InjectManager()
  async createMembers(
    data: CreateMemberInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Member[]> {
    return this.createMembers_(data, sharedContext);
  }

  @InjectTransactionManager()
  private async createMembers_(
    data: CreateMemberInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Member[]> {
    return this.authzMemberRepository_.create(data, sharedContext);
  }

  @InjectManager()
  async updateMembers(
    data: UpdateMemberInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Member[]> {
    return this.updateMembers_(data, sharedContext);
  }

  @InjectTransactionManager()
  private async updateMembers_(
    data: UpdateMemberInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<Member[]> {
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
  @InjectManager()
  async userHasAccess(userId: string, resource: string, method: string): Promise<boolean> {
    return this.userHasAccess_(userId, resource, method);
  }

  @InjectTransactionManager()
  async userHasAccess_(
    userId: string,
    resource: string,
    method: string,
    @MedusaContext() ctx?: Context<EntityManager>,
  ): Promise<boolean> {
    if (this.isExcludedRoute(resource, method)) {
      return true;
    }

    const [member] = await this.members.list({ user_id: userId }, {}, ctx);

    if (!member || !member.role.id) {
      return false;
    }

    const role = await this.roles.retrieve(member.role.id, {}, ctx);
    if (!role) {
      return false;
    }

    const action = this.methodToAction(method);

    const policies = await this.policies.list({ role_id: role.id }, {}, ctx);

    const policiesWithPermissions = await Promise.all(
      policies.map(async (p) => {
        p.permission = await this.permissions.retrieve(p.permission.id, {}, ctx);
        return p;
      })
    );

    return policiesWithPermissions.some(({ permission }) => {
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
    } as any as Category;
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

    return role
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
      member = membersResult.find((m) => m.user.id === userId);

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
