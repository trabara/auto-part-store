import { createEntityRoutes } from "@repo/framework/entity/server";
import { Brand, PartNumber } from "../../../modules/parts/entities";

/**
 * Generic CRUD API at `/admin/parts/:entity[/:id]` over the parts module.
 * Only the entities listed here are reachable; any other `:entity` is a 404.
 */
export const partsRoutes = createEntityRoutes({ entities: [Brand, PartNumber] });
