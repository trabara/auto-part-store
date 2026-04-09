import { DAL } from "@medusajs/framework/types";
import { Permission } from "@trabara/core";
import { BaseModuleService } from "@trabara/common";

export class AuthzPermissionCrudService extends BaseModuleService<Permission> {
  constructor(
    repo: DAL.RepositoryService<Permission>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "AuthzPermission");
  }
}