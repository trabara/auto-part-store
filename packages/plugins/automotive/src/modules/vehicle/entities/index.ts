import { defineEntities } from "@repo/framework/entity";
import {
  AutomotiveAttribute,
  Fitment,
  FitmentCondition,
  FitmentConditionGroup,
  FitmentPosition,
} from "./fitment";
import { Vehicle, VehicleEngine, VehicleMake, VehicleModel } from "./vehicle";

export * from "./fitment";
export * from "./vehicle";

declare module "@repo/framework/entity" {
  interface EntityRegistry {
    Vehicle: typeof Vehicle;
    VehicleMake: typeof VehicleMake;
    VehicleModel: typeof VehicleModel;
    VehicleEngine: typeof VehicleEngine;
    Fitment: typeof Fitment;
    FitmentPosition: typeof FitmentPosition;
    FitmentConditionGroup: typeof FitmentConditionGroup;
    FitmentCondition: typeof FitmentCondition;
    AutomotiveAttribute: typeof AutomotiveAttribute;
  }
}

/** All automotive entities; keys are the MedusaService model names. */
export const automotiveEntities = defineEntities({
  Vehicle,
  VehicleMake,
  VehicleModel,
  VehicleEngine,
  Fitment,
  FitmentPosition,
  FitmentConditionGroup,
  FitmentCondition,
  AutomotiveAttribute,
});
