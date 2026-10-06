import { defineEntities } from "@repo/framework/entity";
// Link targets must be defined before this module's relations are validated.
import "@repo/framework/medusa";
import { PARTS_MODULE } from "../constants";
import { Brand, PartNumber } from "./parts";

export * from "./parts";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    Brand: typeof Brand;
    PartNumber: typeof PartNumber;
  }
}

/** Parts module entities; keys are the MedusaService model names. */
export const partsEntities = defineEntities({ Brand, PartNumber }, { module: PARTS_MODULE, path: "parts" });
