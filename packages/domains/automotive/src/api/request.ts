// Request accessors shared by the route handlers (the HTTP adapter): module
// services from the request scope, the logged-in customer, parsed params.
import type { AuthenticatedMedusaRequest, MedusaRequest } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";
import type { StoreSelectorParams } from "./store/validators";

export const vehicleService = (req: MedusaRequest<any>) => req.scope.resolve<VehicleModuleService>(VEHICLE_MODULE);

/** Selector query parameters (validated by the middleware). */
export const selectorParams = (req: MedusaRequest<any>) => req.validatedQuery as StoreSelectorParams;

/** A required selector parameter (400 when missing). */
export function required(value: string | undefined, name: string): string {
  if (!value) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${name} is required`);
  return value;
}

/** Garage writes go through the framework's workflows on this target. */
export const GARAGE_TARGET = { module: VEHICLE_MODULE, entity: "CustomerVehicle" };

export const customerId = (req: AuthenticatedMedusaRequest<any>) => req.auth_context.actor_id;

/** 404 unless the garage vehicle belongs to the logged-in customer. */
export const ownGarageVehicle = (
  req: AuthenticatedMedusaRequest<any>,
  id: string,
): ReturnType<VehicleModuleService["retrieveGarageVehicle"]> => vehicleService(req).retrieveGarageVehicle(customerId(req), id);
