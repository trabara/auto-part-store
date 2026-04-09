import { DAL } from "@medusajs/framework/types";
import { BaseModuleService } from "@trabara/common";
import { Role } from "@trabara/core";

export class AuthzRoleCrudService extends BaseModuleService<Role> {
    constructor(
        repo: DAL.RepositoryService<Role>,
        baseRepo: DAL.RepositoryService<any>,
    ) {
        super(repo, baseRepo, "AuthzRole");
    }
}