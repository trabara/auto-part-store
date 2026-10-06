import { getEntityUrl } from "@repo/framework/entity";
import { fitmentEntities } from "../src/modules/fitment/entities";
import { partsEntities } from "../src/modules/parts/entities";
import { vehicleEntities } from "../src/modules/vehicle/entities";

/** Admin API collection URL of an entity by key (`vehicle_make` → `/admin/vehicles/vehicle_make`). */
export function adminUrl(key: string): string {
  const entity = vehicleEntities.byKey(key) ?? fitmentEntities.byKey(key) ?? partsEntities.byKey(key);
  if (!entity) throw new Error(`No entity "${key}"`);
  return getEntityUrl(entity.name)!;
}
