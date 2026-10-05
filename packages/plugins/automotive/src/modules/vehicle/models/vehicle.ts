// DML models built from the entity definitions (server only). Medusa
// discovers a module's models (e.g. for migrations) from the non-index files
// of its `models/` folder, hence the named exports.
import { toModels } from "@repo/framework/entity/server";
import { automotiveEntities } from "../entities";

export const automotiveModels = toModels(automotiveEntities);

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
} = automotiveModels;
