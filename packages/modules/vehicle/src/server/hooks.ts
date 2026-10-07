// Vehicle module rules that span rows, run inside the framework's workflows.
import { onEntity, type HookContext } from "@repo/framework/entity/server";
import { VEHICLE_MODULE } from "../contract";
import type VehicleModuleService from "./service";

const vehicles = (ctx: HookContext) => ctx.container.resolve<VehicleModuleService>(VEHICLE_MODULE);

onEntity("Vehicle", {
  created: { run: async ({ records }, ctx) => vehicles(ctx).assertWithinGeneration(records.map((r) => r.id)) },
  updated: { run: async ({ records }, ctx) => vehicles(ctx).assertWithinGeneration(records.map((r) => r.id)) },
});

