import { Module } from "@medusajs/framework/utils";
import { VEHICLE_MODULE } from "./constants";
import VehicleModuleService from "./service";

export { VEHICLE_MODULE };

export default Module(VEHICLE_MODULE, {
  service: VehicleModuleService,
});

export { type VehicleModuleService };
