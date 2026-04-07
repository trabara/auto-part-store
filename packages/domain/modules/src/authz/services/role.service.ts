import { DAL } from "@medusajs/framework/types";
import { BaseModuleService } from "../../shared";
import * as Models from "../models";

export class AuthzRoleCrudService extends BaseModuleService<Models.AuthzRole> {
    constructor(
        repo: DAL.RepositoryService<Models.AuthzRole>,
        baseRepo: DAL.RepositoryService<any>,
    ) {
        super(repo, baseRepo, "AuthzRole");
    }
}