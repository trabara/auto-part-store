import { getEntityUrl } from "@repo/framework/entity";
import { fitmentEntities } from "@repo/module-fitment/contract";
import { partsEntities } from "@repo/module-parts/contract";
import { vehicleEntities } from "@repo/module-vehicle/contract";

/** Admin API collection URL of an entity by key (`vehicle_make` → `/admin/vehicles/vehicle_make`). */
export function adminUrl(key: string): string {
  const entity = vehicleEntities.byKey(key) ?? fitmentEntities.byKey(key) ?? partsEntities.byKey(key);
  if (!entity) throw new Error(`No entity "${key}"`);
  return getEntityUrl(entity.name)!;
}
