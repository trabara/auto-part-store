// Domain hook (vehicle → fitment): deleting vehicles soft-deletes what points
// at them, fitments (id column in the fitment module) and garage entries.
// Restored if the delete rolls back.
import { onEntity, type HookContext } from "@repo/framework/entity/server";
import { FITMENT_MODULE, type FitmentModuleService } from "../../modules/fitment";
import { VEHICLE_MODULE, type VehicleModuleService } from "../../modules/vehicle";

const fitments = (ctx: HookContext) => ctx.container.resolve<FitmentModuleService>(FITMENT_MODULE);
const vehicles = (ctx: HookContext) => ctx.container.resolve<VehicleModuleService>(VEHICLE_MODULE);

onEntity("Vehicle", {
  deleted: {
    async run({ ids }, ctx) {
      const fitmentIds = (await fitments(ctx).listFitments({ vehicle_id: ids }, { select: ["id"] })).map((f) => f.id);
      const garageIds = (await vehicles(ctx).listCustomerVehicles({ vehicle_id: ids }, { select: ["id"] })).map((g) => g.id);
      if (fitmentIds.length) await fitments(ctx).softDeleteFitments(fitmentIds);
      if (garageIds.length) await vehicles(ctx).softDeleteCustomerVehicles(garageIds);
      return { fitments: fitmentIds, garage: garageIds };
    },
    async compensate({ fitments: fitmentIds, garage }, ctx) {
      if (fitmentIds.length) await fitments(ctx).restoreFitments(fitmentIds);
      if (garage.length) await vehicles(ctx).restoreCustomerVehicles(garage);
    },
  },
});
