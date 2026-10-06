import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http";
import { CustomerVehicle } from "../../../modules/vehicle/entities";
import { VEHICLE_MODULE, type VehicleModuleService } from "../../../modules/vehicle";

/** Garage writes go through the framework's workflows on this target. */
export const GARAGE_TARGET = { module: VEHICLE_MODULE, entity: "CustomerVehicle" };

/** Store payloads: the customer comes from the session, never the body. */
export const GarageCreateSchema = CustomerVehicle.dto.create.omit({ customer_id: true });
export const GarageUpdateSchema = CustomerVehicle.dto.update.omit({ customer_id: true });

export const customerId = (req: AuthenticatedMedusaRequest<any>) => req.auth_context.actor_id;

export const vehicleService = (req: AuthenticatedMedusaRequest<any>) =>
  req.scope.resolve<VehicleModuleService>(VEHICLE_MODULE);

/** 404 unless the garage vehicle belongs to the logged-in customer. */
export const ownGarageVehicle = (req: AuthenticatedMedusaRequest<any>, id: string) =>
  vehicleService(req).retrieveGarageVehicle(customerId(req), id);
