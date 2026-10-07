import { Module } from "@medusajs/framework/utils";
import { GARAGE_MODULE } from "../contract";
// Cross-row rules (one default garage vehicle per customer).
import "./hooks";
import GarageModuleService from "./service";

export { GARAGE_MODULE };

export default Module(GARAGE_MODULE, {
  service: GarageModuleService,
});

export { type GarageModuleService };
export type { GarageEntry } from "./service";

export { garageManifest } from "../contract";
export { GARAGE_PATH, garageRoutes } from "./http";
