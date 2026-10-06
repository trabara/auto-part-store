import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { entityLabel } from "@repo/framework/entity";
import { CustomerVehicle, Vehicle } from "../../../modules/vehicle/entities";
import { VEHICLE_MODULE } from "../../../modules/vehicle";

/** Garage writes go through the framework's workflows on this target. */
export const GARAGE_TARGET = { module: VEHICLE_MODULE, entity: "CustomerVehicle" };

/** Store payloads: the customer comes from the session, never the body. */
export const GarageCreateSchema = CustomerVehicle.dto.create.omit({ customer_id: true });
export const GarageUpdateSchema = CustomerVehicle.dto.update.omit({ customer_id: true });

const FIELDS = [
  "id",
  "nickname",
  "vin",
  "registration",
  "is_default",
  "build_year",
  "build_month",
  "vehicle_id",
  "created_at",
  ...Vehicle.label.fields.map((f) => `vehicle.${f}`),
];

export const customerId = (req: AuthenticatedMedusaRequest) => req.auth_context.actor_id;

/** The customer's garage vehicles (optionally one), each with its vehicle label. */
export async function listGarage(req: AuthenticatedMedusaRequest, id?: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: CustomerVehicle.modelName,
    fields: FIELDS,
    filters: { customer_id: customerId(req), ...(id ? { id } : {}) },
  });
  return (data as Record<string, any>[]).map((row): Record<string, any> => ({
    ...row,
    vehicle_label: entityLabel(Vehicle, row.vehicle),
  }));
}

/** 404 unless the garage vehicle belongs to the logged-in customer. */
export async function ownGarageVehicle(req: AuthenticatedMedusaRequest, id: string) {
  const [row] = await listGarage(req, id);
  if (!row) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Garage vehicle "${id}" not found`);
  return row;
}
