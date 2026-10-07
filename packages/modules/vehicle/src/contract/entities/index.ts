import { defineEntities } from "@repo/framework/entity";
// Link targets must be defined before this module's relations are validated.
import "@repo/framework/medusa";
import { VEHICLE_MODULE } from "../manifest";
import { CatalogTask } from "./catalog-task";
import { Vehicle } from "./vehicle";
import { VehicleEngine } from "./vehicle-engine";
import { VehicleGeneration } from "./vehicle-generation";
import { VehicleMake } from "./vehicle-make";
import { VehicleModel } from "./vehicle-model";
import { VehicleReference } from "./vehicle-reference";

export * from "./enums";
export * from "./shared";
export * from "./vehicle-make";
export * from "./vehicle-model";
export * from "./vehicle-generation";
export * from "./vehicle-engine";
export * from "./vehicle";
export * from "./vehicle-reference";
export * from "./catalog-task";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    Vehicle: typeof Vehicle;
    VehicleMake: typeof VehicleMake;
    VehicleModel: typeof VehicleModel;
    VehicleGeneration: typeof VehicleGeneration;
    VehicleEngine: typeof VehicleEngine;
    VehicleReference: typeof VehicleReference;
    CatalogTask: typeof CatalogTask;
  }
}

/** Vehicle module entities; keys are the MedusaService model names. */
export const vehicleEntities = defineEntities(
  { Vehicle, VehicleMake, VehicleModel, VehicleGeneration, VehicleEngine, VehicleReference, CatalogTask },
  { module: VEHICLE_MODULE, path: "vehicles" },
);
