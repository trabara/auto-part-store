// Medusa discovers a module's DML models (e.g. for migrations) from the
// non-index files of its `models/` folder; definitions live in ../entities.
import { automotiveEntities } from "../entities";

export const {
  Vehicle,
  VehicleMake,
  VehicleModel,
  VehicleEngine,
  Fitment,
  FitmentPosition,
  FitmentConditionGroup,
  FitmentCondition,
  AutomotiveAttribute,
} = automotiveEntities.models;
