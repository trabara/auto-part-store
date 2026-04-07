import { DAL } from "@medusajs/framework/types";
import { BaseModuleService } from "../../shared";
import { AuthzPermission } from "../models";

export class AuthzPermissionCrudService extends BaseModuleService<AuthzPermission> {
  constructor(
    repo: DAL.RepositoryService<AuthzPermission>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "AuthzPermission");
  }
}