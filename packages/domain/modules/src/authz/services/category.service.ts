import { DAL } from "@medusajs/framework/types";
import { Category } from "@trabara/core";
import { BaseModuleService } from "@trabara/common";

export class AuthzCategoryCrudService extends BaseModuleService<Category> {
    constructor(
        repo: DAL.RepositoryService<Category>,
        baseRepo: DAL.RepositoryService<any>,
    ) {
        super(repo, baseRepo, "AuthzCategory");
    }
}
