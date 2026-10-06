import { Module } from "@medusajs/framework/utils";
import { PARTS_MODULE } from "./constants";
import PartsModuleService from "./service";

export { PARTS_MODULE };

export default Module(PARTS_MODULE, {
  service: PartsModuleService,
});

export { type PartsModuleService };

export { partsManifest } from "./manifest";
