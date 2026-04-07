import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type {
  AssignUsersInput,
  AuthzMemberDto,
  Category,
  CategoryPermissionsResult,
  CreateCategoryInput,
  CreateMemberInput,
  CreatePermissionInput,
  CreateRoleInput,
  Permission,
  Policy,
  Role,
  UpdateMemberInput,
} from "../dtos";
import type { IBaseModuleService } from "./base-module-service";

// Sub-service interfaces for the namespace accessor pattern

export interface IAuthzRoleSubService extends IBaseModuleService<Role> {}

export interface IAuthzPermissionSubService extends IBaseModuleService<Permission> {}

export interface IAuthzPolicySubService extends Pick<
  IBaseModuleService<Policy>,
  "list" | "listAndCount" | "create" | "delete"
> {}

export interface IAuthzMemberSubService extends Omit<
  IBaseModuleService<AuthzMemberDto>,
  "delete"
> {
  delete(
    ids: string | string[] | Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;
}

export interface IAuthzCategorySubService extends IBaseModuleService<Category> {}

export interface IAuthzModuleService {
  readonly roles: IAuthzRoleSubService;
  readonly permissions: IAuthzPermissionSubService;
  readonly policies: IAuthzPolicySubService;
  readonly members: IAuthzMemberSubService;
  readonly categories: IAuthzCategorySubService;

  // Remote Query joiner delegates
  listAuthzRoles(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<Role[]>;

  listAndCountAuthzRoles(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<[Role[], number]>;

  listAuthzPermissions(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<Permission[]>;

  listAndCountAuthzPermissions(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<[Permission[], number]>;

  listAuthzPolicies(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<Policy[]>;

  listAndCountAuthzPolicies(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<[Policy[], number]>;

  listAuthzMembers(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<AuthzMemberDto[]>;

  listAndCountAuthzMembers(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<[AuthzMemberDto[], number]>;

  listAuthzCategories(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<Category[]>;

  listAndCountAuthzCategories(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<[Category[], number]>;

  // Write delegates
  createPermissions(
    data: CreatePermissionInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<Permission[]>;

  createMembers(
    data: CreateMemberInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<AuthzMemberDto[]>;

  updateMembers(
    data: UpdateMemberInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<AuthzMemberDto[]>;

  // High-level methods
  userHasAccess(
    userId: string,
    resource: string,
    method: string,
  ): Promise<boolean>;

  createPermissionCategory(
    dto: CreateCategoryInput,
    sharedContext?: Context<EntityManager>,
  ): Promise<CategoryPermissionsResult>;

  createPermissionCategories(
    dtos: CreateCategoryInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<CategoryPermissionsResult[]>;

  deletePermissionsByCategoryIds(
    categoryIds: string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  createRoles(
    inputs: CreateRoleInput[],
    sharedContext?: Context<EntityManager>,
  ): Promise<Role[]>;

  assignRbacUsers(
    roleId: string,
    input: AssignUsersInput,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  updateRolePolicies(
    roleId: string,
    permissionIds: string[],
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;
}
