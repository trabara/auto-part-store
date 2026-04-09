import { DAL } from "@medusajs/framework/types";
import { BaseModuleService } from "@trabara/common";
import * as Models from "../models";

export class EngineService extends BaseModuleService<Models.Engine> {
    constructor(
        repo: DAL.RepositoryService<Models.Engine>,
        baseRepo: DAL.RepositoryService<any>,
    ) {
        super(repo, baseRepo, "Engine");
    }
}