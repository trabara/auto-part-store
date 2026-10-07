import { Module } from "@medusajs/framework/utils";
import { VEHICLE_MODULE } from "../contract";
// Cross-row rules (years within generation, single default garage vehicle).
import "./hooks";
import VehicleModuleService from "./service";

export { VEHICLE_MODULE };

export default Module(VEHICLE_MODULE, {
  service: VehicleModuleService,
});

export { type VehicleModuleService };

export { vehicleManifest } from "../contract";
export { VEHICLES_PATH, vehicleRoutes } from "./http";
