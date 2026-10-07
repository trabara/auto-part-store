// Garage module rules that span rows, run inside the framework's workflows.
import { onEntity, type HookContext } from "@repo/framework/entity/server";
import { GARAGE_MODULE } from "../contract";
import type GarageModuleService from "./service";

const garage = (ctx: HookContext) => ctx.container.resolve<GarageModuleService>(GARAGE_MODULE);

// One default garage vehicle per customer (cleared defaults restored on rollback).
const clearOtherDefaults = async ({ records }: { records: { id: string; is_default?: boolean }[] }, ctx: HookContext) => ({
  cleared: await garage(ctx).clearOtherDefaults(records.filter((r) => r.is_default).map((r) => r.id)),
});
const restoreDefaults = async ({ cleared }: { cleared: string[] }, ctx: HookContext) => garage(ctx).restoreDefaults(cleared);

onEntity("CustomerVehicle", {
  created: { run: clearOtherDefaults, compensate: restoreDefaults },
  updated: { run: clearOtherDefaults, compensate: restoreDefaults },
});
