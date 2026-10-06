import { Module } from "@medusajs/framework/utils";
import { PARTS_MODULE } from "./constants";
// Brand ↔ shared "Brand" option sync, run by the framework's workflows.
import "./hooks";
import PartsModuleService from "./service";

export { PARTS_MODULE };

export default Module(PARTS_MODULE, {
  service: PartsModuleService,
});

export { type PartsModuleService };
