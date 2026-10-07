import type { MedusaContainer } from "@medusajs/framework/types";
import { GARAGE_MODULE, type GarageEntry, type GarageModuleService } from "@repo/module-garage";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";

/** A garage vehicle as the storefront sees it: the garage entry plus its vehicle's label. */
export type GarageVehicle = GarageEntry & { vehicle_label: string | null };

/**
 * A customer's garage vehicles (optionally one), oldest first, each labelled
 * from the vehicle catalog (two modules: the garage owns the entries, the
 * vehicle module the catalog).
 */
export async function garageVehicles(container: MedusaContainer, customerId: string, id?: string): Promise<GarageVehicle[]> {
  const entries = await container.resolve<GarageModuleService>(GARAGE_MODULE).listGarage(customerId, id);
  const labels = await container
    .resolve<VehicleModuleService>(VEHICLE_MODULE)
    .vehicleLabels([...new Set(entries.map((e) => e.vehicle_id))]);
  return entries.map((e) => ({ ...e, vehicle_label: labels[e.vehicle_id] ?? null }));
}

/** The customer's garage vehicle, labelled, or 404 (also when it belongs to someone else). */
export async function garageVehicle(container: MedusaContainer, customerId: string, id: string): Promise<GarageVehicle> {
  const entry = await container.resolve<GarageModuleService>(GARAGE_MODULE).retrieveGarageVehicle(customerId, id);
  const labels = await container.resolve<VehicleModuleService>(VEHICLE_MODULE).vehicleLabels([entry.vehicle_id]);
  return { ...entry, vehicle_label: labels[entry.vehicle_id] ?? null };
}
