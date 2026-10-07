// Generic admin API of the garage module: `/admin/garage/:entity[/:id]`
// (path declared by its entity set). Entities not listed here are a 404.
import { createEntityRoutes } from "@repo/framework/entity/server";
import { CustomerVehicle, garageEntities } from "../contract";

export const GARAGE_PATH = `/admin/${garageEntities.path}`;

export const garageRoutes = createEntityRoutes({ entities: [CustomerVehicle] });
