// Generic admin API of the parts module: `/admin/parts/:entity[/:id]`
// (path declared by its entity set). Entities not listed here are a 404.
import { createEntityRoutes } from "@repo/framework/entity/server";
import { Brand, PartNumber, partsEntities } from "../contract";

export const PARTS_PATH = `/admin/${partsEntities.path}`;

export const partsRoutes = createEntityRoutes({ entities: [Brand, PartNumber] });
