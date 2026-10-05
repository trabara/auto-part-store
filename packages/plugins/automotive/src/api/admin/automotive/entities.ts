import { MedusaError, pluralize } from "@medusajs/framework/utils";
import { snakeCase } from "lodash";

/**
 * Entities exposed by the generic `/admin/automotive/:entity` routes, keyed by
 * their snake_case URL segment and mapped to their `MedusaService` model key.
 * Anything not listed here is a 404 — other models of the module are not
 * reachable through these routes.
 */
export const AUTOMOTIVE_ENTITIES = {
  vehicle: "Vehicle",
  vehicle_engine: "VehicleEngine",
  vehicle_model: "VehicleModel",
  vehicle_make: "VehicleMake",
  fitment: "Fitment",
  fitment_position: "FitmentPosition",
} as const;

export type AutomotiveEntityKey = keyof typeof AUTOMOTIVE_ENTITIES;

export type ResolvedEntity = {
  /** snake_case key, also the remote-query entity name. */
  key: AutomotiveEntityKey;
  /** Plural model name used by generated service methods (`createVehicleEngines`). */
  plural: string;
};

export function resolveEntity(param: string): ResolvedEntity {
  const key = snakeCase(param);
  if (!(key in AUTOMOTIVE_ENTITIES)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Unknown entity "${key}"`,
    );
  }
  const model = AUTOMOTIVE_ENTITIES[key as AutomotiveEntityKey];
  return { key: key as AutomotiveEntityKey, plural: pluralize(model) };
}
