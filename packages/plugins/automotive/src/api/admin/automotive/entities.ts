import { createEntityRoutes } from "@repo/framework/entity/server";
import { Fitment, FitmentPosition } from "../../../modules/fitment/entities";
import {
  CustomerVehicle,
  Vehicle,
  VehicleEngine,
  VehicleGeneration,
  VehicleMake,
  VehicleModel,
  VehicleReference,
} from "../../../modules/vehicle/entities";

/**
 * Generic CRUD API at `/admin/automotive/:entity[/:id]` over the vehicle and
 * fitment modules (each entity uses its own module). Only the entities listed
 * here are reachable; any other `:entity` is a 404.
 */
export const automotiveRoutes = createEntityRoutes({
  entities: [
    Vehicle,
    VehicleEngine,
    VehicleModel,
    VehicleMake,
    VehicleGeneration,
    VehicleReference,
    CustomerVehicle,
    Fitment,
    FitmentPosition,
  ],
});
