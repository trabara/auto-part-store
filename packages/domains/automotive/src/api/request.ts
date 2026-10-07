// Request accessors shared by the route handlers (the HTTP adapter): module
// services from the request scope, the logged-in customer, parsed params.
import type { AuthenticatedMedusaRequest, MedusaRequest } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { GARAGE_MODULE } from "@repo/module-garage";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";
import { garageVehicle, garageVehicles } from "../queries/garage";
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
export const GARAGE_TARGET = { module: GARAGE_MODULE, entity: "CustomerVehicle" };

export const customerId = (req: AuthenticatedMedusaRequest<any>) => req.auth_context.actor_id;

/** 404 unless the garage vehicle belongs to the logged-in customer. */
export const ownGarageVehicle = (req: AuthenticatedMedusaRequest<any>, id: string) =>
  garageVehicle(req.scope, customerId(req), id);

/** The logged-in customer's garage vehicles, labelled. */
export const ownGarage = (req: AuthenticatedMedusaRequest<any>) => garageVehicles(req.scope, customerId(req));
