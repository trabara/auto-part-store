import { DAL } from "@medusajs/framework/types";
import { AuthzPolicy } from "../models";
import { BaseModuleService } from "../../shared";

export class AuthzPolicyCrudService extends BaseModuleService<AuthzPolicy> {
    constructor(
        repo: DAL.RepositoryService<AuthzPolicy>,
        baseRepo: DAL.RepositoryService<any>,
    ) {
        super(repo, baseRepo, "AuthzPolicy");
    }
}
