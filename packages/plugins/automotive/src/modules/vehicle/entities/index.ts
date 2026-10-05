import { defineEntities } from "@repo/framework/entity";
import { VEHICLE_MODULE } from "../constants";
import { Vehicle, VehicleEngine, VehicleMake, VehicleModel } from "./vehicle";

export * from "./vehicle";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    Vehicle: typeof Vehicle;
    VehicleMake: typeof VehicleMake;
    VehicleModel: typeof VehicleModel;
    VehicleEngine: typeof VehicleEngine;
  }
}

/** Vehicle module entities; keys are the MedusaService model names. */
export const vehicleEntities = defineEntities(
  { Vehicle, VehicleMake, VehicleModel, VehicleEngine },
  { module: VEHICLE_MODULE },
);
