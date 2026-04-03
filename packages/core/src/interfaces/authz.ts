import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type {
  AssignUsersInput,
  CategoryPermissionsResult,
  CreateCategoryInput,
  CreateRoleInput,
  Role,
} from "../dtos";

export interface IAuthzModuleService {
  userHasAccess(
    userId: string,
    resource: string,
    method: string,
  ): Promise<boolean>;

  // AuthzRole CRUD
  listAuthzRoles(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  retrieveAuthzRole(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createAuthzRoles(
    data: any | any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  updateAuthzRoles(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteAuthzRoles(
    ids: any,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  // AuthzPermission CRUD
  listAuthzPermissions(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  retrieveAuthzPermission(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createAuthzPermissions(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  updateAuthzPermissions(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteAuthzPermissions(
    ids: any,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  // AuthzPolicy CRUD
  listAuthzPolicies(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  createAuthzPolicies(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteAuthzPolicies(
    ids: any,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  // AuthzMember CRUD
  listAuthzMembers(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  createAuthzMembers(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  updateAuthzMembers(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteAuthzMembers(
    ids: any,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  // AuthzCategory CRUD
  listAuthzCategories(
    filters?: Record<string, any>,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  retrieveAuthzCategory(
    id: string,
    config?: Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  createAuthzCategories(
    data: any | any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any>;

  updateAuthzCategories(
    data: any[],
    sharedContext?: Context<EntityManager>,
  ): Promise<any[]>;

  deleteAuthzCategories(
    ids: any,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;

  // Custom methods
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
}
