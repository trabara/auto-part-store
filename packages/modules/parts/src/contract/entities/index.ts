import { defineEntities } from "@repo/framework/entity";
// Link targets must be defined before this module's relations are validated.
import "@repo/framework/medusa";
import { PARTS_MODULE } from "../manifest";
import { Brand } from "./brand";
import { PartNumber } from "./part-number";

export * from "./enums";
export * from "./brand";
export * from "./part-number";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    Brand: typeof Brand;
    PartNumber: typeof PartNumber;
  }
}

/** Parts module entities; keys are the MedusaService model names. */
export const partsEntities = defineEntities({ Brand, PartNumber }, { module: PARTS_MODULE, path: "parts" });
