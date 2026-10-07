// Vehicle module rules that span rows, run inside the framework's workflows.
import { onEntity, type HookContext } from "@repo/framework/entity/server";
import { VEHICLE_MODULE } from "../contract";
import type VehicleModuleService from "./service";

const vehicles = (ctx: HookContext) => ctx.container.resolve<VehicleModuleService>(VEHICLE_MODULE);

onEntity("Vehicle", {
  created: { run: async ({ records }, ctx) => vehicles(ctx).assertWithinGeneration(records.map((r) => r.id)) },
  updated: { run: async ({ records }, ctx) => vehicles(ctx).assertWithinGeneration(records.map((r) => r.id)) },
});

// One default garage vehicle per customer (cleared defaults restored on rollback).
const clearOtherDefaults = async ({ records }: { records: { id: string; is_default?: boolean }[] }, ctx: HookContext) => ({
  cleared: await vehicles(ctx).clearOtherDefaults(records.filter((r) => r.is_default).map((r) => r.id)),
});
const restoreDefaults = async ({ cleared }: { cleared: string[] }, ctx: HookContext) =>
  vehicles(ctx).restoreDefaults(cleared);

onEntity("CustomerVehicle", {
  created: { run: clearOtherDefaults, compensate: restoreDefaults },
  updated: { run: clearOtherDefaults, compensate: restoreDefaults },
});
