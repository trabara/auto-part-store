// DML models built from the entity definitions. Medusa discovers a module's
// models from the non-index files of `models/`.
import { toModels } from "@repo/framework/entity/server";
import { garageEntities } from "../../contract";

export const garageModels = toModels(garageEntities);

export const { CustomerVehicle } = garageModels;
