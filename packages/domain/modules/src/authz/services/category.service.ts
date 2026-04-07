import { DAL } from "@medusajs/framework/types";
import { BaseModuleService } from "../../shared";
import * as Models from "../models";

export class AuthzCategoryCrudService extends BaseModuleService<Models.AuthzCategory> {
    constructor(
        repo: DAL.RepositoryService<Models.AuthzCategory>,
        baseRepo: DAL.RepositoryService<any>,
    ) {
        super(repo, baseRepo, "AuthzCategory");
    }
}
