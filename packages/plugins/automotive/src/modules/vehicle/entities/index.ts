import { defineEntities } from "@repo/framework/entity";
// Link targets must be defined before this module's relations are validated.
import "../../../entities/medusa";
import { VEHICLE_MODULE } from "../constants";
import {
  CustomerVehicle,
  Vehicle,
  VehicleEngine,
  VehicleGeneration,
  VehicleMake,
  VehicleModel,
  VehicleReference,
} from "./vehicle";

export * from "./vehicle";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    Vehicle: typeof Vehicle;
    VehicleMake: typeof VehicleMake;
    VehicleModel: typeof VehicleModel;
    VehicleGeneration: typeof VehicleGeneration;
    VehicleEngine: typeof VehicleEngine;
    VehicleReference: typeof VehicleReference;
    CustomerVehicle: typeof CustomerVehicle;
  }
}

/** Vehicle module entities; keys are the MedusaService model names. */
export const vehicleEntities = defineEntities(
  { Vehicle, VehicleMake, VehicleModel, VehicleGeneration, VehicleEngine, VehicleReference, CustomerVehicle },
  { module: VEHICLE_MODULE, path: "vehicles" },
);
