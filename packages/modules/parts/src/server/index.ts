import { Module } from "@medusajs/framework/utils";
import { PARTS_MODULE } from "../contract";
import PartsModuleService from "./service";

export { PARTS_MODULE };

export default Module(PARTS_MODULE, {
  service: PartsModuleService,
});

export { type PartsModuleService };

export { partsManifest } from "../contract";
export { PARTS_PATH, partsRoutes } from "./http";
