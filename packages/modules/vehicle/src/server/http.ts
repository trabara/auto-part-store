// Generic admin API of the vehicle module: `/admin/vehicles/:entity[/:id]`
// (path declared by its entity set). Entities not listed here are a 404.
import { createEntityRoutes } from "@repo/framework/entity/server";
import {
  CustomerVehicle,
  Vehicle,
  VehicleEngine,
  VehicleGeneration,
  VehicleMake,
  VehicleModel,
  VehicleReference,
  vehicleEntities,
} from "../contract";

export const VEHICLES_PATH = `/admin/${vehicleEntities.path}`;

export const vehicleRoutes = createEntityRoutes({
  entities: [Vehicle, VehicleEngine, VehicleModel, VehicleMake, VehicleGeneration, VehicleReference, CustomerVehicle],
});
