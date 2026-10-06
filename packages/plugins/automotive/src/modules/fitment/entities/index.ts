import { defineEntities } from "@repo/framework/entity";
// Link targets must be defined before this module's relations are validated.
import "../../vehicle/entities";
import { FITMENT_MODULE } from "../constants";
import {
  AutomotiveAttribute,
  Fitment,
  FitmentCondition,
  FitmentConditionGroup,
  FitmentPosition,
} from "./fitment";

import { ProductVariant } from "./product-variant";

export * from "./fitment";
export * from "./product-variant";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    Fitment: typeof Fitment;
    ProductVariant: typeof ProductVariant;
    FitmentPosition: typeof FitmentPosition;
    FitmentConditionGroup: typeof FitmentConditionGroup;
    FitmentCondition: typeof FitmentCondition;
    AutomotiveAttribute: typeof AutomotiveAttribute;
  }
}

/** Fitment module entities; keys are the MedusaService model names. */
export const fitmentEntities = defineEntities(
  { Fitment, FitmentPosition, FitmentConditionGroup, FitmentCondition, AutomotiveAttribute },
  { module: FITMENT_MODULE },
);
