import { defineEntities } from "@repo/framework/entity";
// Link targets must be defined before this module's relations are validated.
import "@repo/module-vehicle/contract";
import "@repo/framework/medusa";
import { GARAGE_MODULE } from "../manifest";
import { CustomerVehicle } from "./customer-vehicle";

export * from "./customer-vehicle";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    CustomerVehicle: typeof CustomerVehicle;
  }
}

/** Garage module entities; keys are the MedusaService model names. */
export const garageEntities = defineEntities({ CustomerVehicle }, { module: GARAGE_MODULE, path: "garage" });
