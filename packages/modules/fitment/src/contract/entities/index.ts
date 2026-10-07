import { defineEntities } from "@repo/framework/entity";
// Link targets must be defined before this module's relations are validated.
import "@repo/module-vehicle/contract";
import "@repo/framework/medusa";
import { FITMENT_MODULE } from "../manifest";
import { AutomotiveAttribute } from "./automotive-attribute";
import { Fitment } from "./fitment";
import { FitmentCondition } from "./fitment-condition";
import { FitmentConditionGroup } from "./fitment-condition-group";
import { FitmentPosition } from "./fitment-position";

export * from "./enums";
export * from "./fitment";
export * from "./fitment-position";
export * from "./fitment-condition-group";
export * from "./fitment-condition";
export * from "./automotive-attribute";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    Fitment: typeof Fitment;
    FitmentPosition: typeof FitmentPosition;
    FitmentConditionGroup: typeof FitmentConditionGroup;
    FitmentCondition: typeof FitmentCondition;
    AutomotiveAttribute: typeof AutomotiveAttribute;
  }
}

/** Fitment module entities; keys are the MedusaService model names. */
export const fitmentEntities = defineEntities(
  { Fitment, FitmentPosition, FitmentConditionGroup, FitmentCondition, AutomotiveAttribute },
  { module: FITMENT_MODULE, path: "fitments" },
);
