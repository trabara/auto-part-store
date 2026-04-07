import type { Context } from "@medusajs/framework/types";
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import type {
  AssignUsersInput,
  CategoryPermissionsResult,
  CreateCategoryInput,
  CreateRoleInput,
  Role,
} from "../dtos";
import type { IBaseModuleService } from "./base-module-service";

// Sub-service interfaces for the namespace accessor pattern

export interface IAuthzRoleSubService extends IBaseModuleService<any> {}

export interface IAuthzPermissionSubService extends IBaseModuleService<any> {}

export interface IAuthzPolicySubService extends Pick<
  IBaseModuleService<any>,
  "list" | "listAndCount" | "create" | "delete"
> {}

export interface IAuthzMemberSubService extends Omit<
  IBaseModuleService<any>,
  "delete"
> {
  delete(
    ids: string | string[] | Record<string, any>,
    sharedContext?: Context<EntityManager>,
  ): Promise<void>;
}

export interface IAuthzCategorySubService extends IBaseModuleService<any> {}

export interface IAuthzModuleService {
  readonly roles: IAuthzRoleSubService;
  readonly permissions: IAuthzPermissionSubService;
  readonly policies: IAuthzPolicySubService;
  readonly members: IAuthzMemberSubService;
  readonly categories: IAuthzCategorySubService;

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
