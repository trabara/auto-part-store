import { DAL } from "@medusajs/framework/types";
import { BaseModuleService } from "../../shared";
import * as Models from "../models";

export class ModelService extends BaseModuleService<Models.Model> {
    constructor(
        repo: DAL.RepositoryService<Models.Model>,
        baseRepo: DAL.RepositoryService<any>,
    ) {
        super(repo, baseRepo, "Model");
    }
}
