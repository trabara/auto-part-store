import { MedusaError, pluralize } from "@medusajs/framework/utils";
import { snakeCase } from "lodash";
import {
  Fitment,
  FitmentPosition,
  Vehicle,
  VehicleEngine,
  VehicleMake,
  VehicleModel,
} from "~/modules/automotive/entities";

/**
 * Entities exposed by the generic `/admin/automotive/:entity` routes (by their
 * snake_case `modelName`). Anything else is a 404 — other models of the module
 * are not reachable through these routes.
 */
export const EXPOSED_ENTITIES = [
  Vehicle,
  VehicleEngine,
  VehicleModel,
  VehicleMake,
  Fitment,
  FitmentPosition,
] as const;

const byKey = new Map<string, (typeof EXPOSED_ENTITIES)[number]>(
  EXPOSED_ENTITIES.map((entity) => [entity.modelName, entity]),
);

export type ResolvedEntity = {
  /** snake_case key, also the remote-query entity name. */
  key: string;
  /** Plural model name used by generated service methods (`createVehicleEngines`). */
  plural: string;
};

export function resolveEntity(param: string): ResolvedEntity {
  const key = snakeCase(param);
  const entity = byKey.get(key);
  if (!entity) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Unknown entity "${key}"`);
  }
  return { key, plural: pluralize(entity.name) };
}
