import { defineEntities } from "@repo/framework/entity";
// Link targets must be defined before this module's relations are validated.
import "../../vehicle/entities";
import "../../../entities/medusa";
import { FITMENT_MODULE } from "../constants";
import {
  AutomotiveAttribute,
  Fitment,
  FitmentCondition,
  FitmentConditionGroup,
  FitmentPosition,
} from "./fitment";

export * from "./fitment";

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
