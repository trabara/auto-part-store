// DML models built from the entity definitions (server only). Medusa
// discovers a module's models (e.g. for migrations) from the non-index files
// of its `models/` folder, hence the named exports.
import { toModels } from "@repo/framework/entity/server";
import { fitmentEntities } from "../entities";

export const fitmentModels = toModels(fitmentEntities);

export const {
  Fitment,
  FitmentPosition,
  FitmentConditionGroup,
  FitmentCondition,
  AutomotiveAttribute,
} = fitmentModels;
