import { createEntityRoutes } from "@repo/framework/entity";
import { AUTOMOTIVE_MODULE } from "~/modules/automotive";
import {
  Fitment,
  FitmentPosition,
  Vehicle,
  VehicleEngine,
  VehicleMake,
  VehicleModel,
} from "~/modules/automotive/entities";

/**
 * Generic CRUD API at `/admin/automotive/:entity[/:id]`. Only the entities
 * listed here are reachable; any other `:entity` is a 404.
 */
export const automotiveRoutes = createEntityRoutes({
  module: AUTOMOTIVE_MODULE,
  entities: [Vehicle, VehicleEngine, VehicleModel, VehicleMake, Fitment, FitmentPosition],
});
