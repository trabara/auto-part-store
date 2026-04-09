import { DAL } from "@medusajs/framework/types";
import { Policy } from "@trabara/core";
import { BaseModuleService } from "@trabara/common";

export class AuthzPolicyCrudService extends BaseModuleService<Policy> {
    constructor(
        repo: DAL.RepositoryService<Policy>,
        baseRepo: DAL.RepositoryService<any>,
    ) {
        super(repo, baseRepo, "AuthzPolicy");
    }
}
