// DML models built from the entity definitions (server only). Medusa
// discovers a module's models from the non-index files of `models/`.
import { toModels } from "@repo/framework/entity/server";
import { partsEntities } from "../entities";

export const partsModels = toModels(partsEntities);

export const { Brand, PartNumber } = partsModels;
