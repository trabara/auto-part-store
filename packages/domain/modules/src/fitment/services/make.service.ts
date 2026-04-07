import { DAL } from "@medusajs/framework/types";
import { BaseModuleService } from "../../shared";
import * as Models from "../models";

export class MakeService extends BaseModuleService<Models.Make> {
  constructor(
    repo: DAL.RepositoryService<Models.Make>,
    baseRepo: DAL.RepositoryService<any>,
  ) {
    super(repo, baseRepo, "Make");
  }
}