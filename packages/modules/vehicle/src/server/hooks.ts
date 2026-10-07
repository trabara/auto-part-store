// Vehicle module rules that span rows, run inside the framework's workflows.
import { onEntity, type HookContext } from "@repo/framework/entity/server";
import { VEHICLE_MODULE } from "../contract";
import type { CatalogRecordEntity } from "../core";
import type VehicleModuleService from "./service";

const vehicles = (ctx: HookContext) => ctx.container.resolve<VehicleModuleService>(VEHICLE_MODULE);

onEntity("Vehicle", {
  created: { run: async ({ records }, ctx) => vehicles(ctx).assertWithinGeneration(records.map((r) => r.id)) },
  updated: { run: async ({ records }, ctx) => vehicles(ctx).assertWithinGeneration(records.map((r) => r.id)) },
});

// Staff edits in the admin (API writes) are HUMAN tier: imports never
// overwrite them. The previous provenance comes back on rollback.
const pinHuman = (entity: CatalogRecordEntity) => ({
  run: async ({ records }: { records: { id: string }[] }, ctx: HookContext) => ({
    previous: await vehicles(ctx).pinHuman(entity, records.map((r) => r.id)),
  }),
  compensate: async ({ previous }: { previous: Record<string, unknown>[] }, ctx: HookContext) =>
    vehicles(ctx).restoreProvenance(entity, previous as any),
});
for (const entity of ["VehicleMake", "VehicleModel", "VehicleGeneration", "VehicleEngine", "Vehicle"] as const) {
  onEntity(entity, { created: pinHuman(entity), updated: pinHuman(entity) });
}
