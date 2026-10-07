// Domain hook (vehicle → fitment, garage): deleting vehicles soft-deletes what
// points at them through id columns: fitments and garage entries.
// Restored if the delete rolls back.
import { onEntity, type HookContext } from "@repo/framework/entity/server";
import { FITMENT_MODULE, type FitmentModuleService } from "@repo/module-fitment";
import { GARAGE_MODULE, type GarageModuleService } from "@repo/module-garage";

const fitments = (ctx: HookContext) => ctx.container.resolve<FitmentModuleService>(FITMENT_MODULE);
const garage = (ctx: HookContext) => ctx.container.resolve<GarageModuleService>(GARAGE_MODULE);

onEntity("Vehicle", {
  deleted: {
    async run({ ids }, ctx) {
      const fitmentIds = (await fitments(ctx).listFitments({ vehicle_id: ids }, { select: ["id"] })).map((f) => f.id);
      const garageIds = (await garage(ctx).listCustomerVehicles({ vehicle_id: ids }, { select: ["id"] })).map((g) => g.id);
      if (fitmentIds.length) await fitments(ctx).softDeleteFitments(fitmentIds);
      if (garageIds.length) await garage(ctx).softDeleteCustomerVehicles(garageIds);
      return { fitments: fitmentIds, garage: garageIds };
    },
    async compensate({ fitments: fitmentIds, garage: garageIds }, ctx) {
      if (fitmentIds.length) await fitments(ctx).restoreFitments(fitmentIds);
      if (garageIds.length) await garage(ctx).restoreCustomerVehicles(garageIds);
    },
  },
});
