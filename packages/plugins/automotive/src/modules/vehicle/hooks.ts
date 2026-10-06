// Vehicle module rules that span rows, run inside the framework's workflows.
import { MedusaError } from "@medusajs/framework/utils";
import { onEntity, type HookContext } from "@repo/framework/entity/server";
import { FITMENT_MODULE } from "../fitment/constants";
import { VEHICLE_MODULE } from "./constants";

const vehicles = (ctx: HookContext) => ctx.container.resolve<any>(VEHICLE_MODULE);

type Range = { year_start: number; year_end: number | null };
const inside = (inner: Range, outer: Range) =>
  inner.year_start >= outer.year_start &&
  (outer.year_end == null || (inner.year_end != null && inner.year_end <= outer.year_end));

/** A configuration's production years must fall within its generation's. */
async function assertWithinGeneration(ctx: HookContext, ids: string[]) {
  const rows = await vehicles(ctx).listVehicles(
    { id: ids },
    { select: ["id", "year_start", "year_end"], relations: ["generation"] },
  );
  for (const v of rows) {
    const g = v.generation;
    if (g && !inside(v, g)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Production years must be within the generation's (${g.year_start}–${g.year_end ?? ""}).`,
      );
    }
  }
}

onEntity("Vehicle", {
  created: { run: async ({ records }, ctx) => assertWithinGeneration(ctx, records.map((r) => r.id)) },
  updated: { run: async ({ records }, ctx) => assertWithinGeneration(ctx, records.map((r) => r.id)) },
});

/**
 * One default garage vehicle per customer: making one the default clears it
 * on the customer's others (restored on rollback).
 */
async function keepSingleDefault(ctx: HookContext, records: { id: string; customer_id?: string; is_default?: boolean }[]) {
  const cleared: string[] = [];
  for (const record of records.filter((r) => r.is_default)) {
    const [current] = await vehicles(ctx).listCustomerVehicles({ id: record.id }, { select: ["customer_id"] });
    const others = await vehicles(ctx).listCustomerVehicles(
      { customer_id: current.customer_id, is_default: true, id: { $ne: record.id } },
      { select: ["id"] },
    );
    if (others.length) {
      await vehicles(ctx).updateCustomerVehicles(others.map((o: { id: string }) => ({ id: o.id, is_default: false })));
      cleared.push(...others.map((o: { id: string }) => o.id));
    }
  }
  return { cleared };
}

const restoreDefaults = async ({ cleared }: { cleared: string[] }, ctx: HookContext) => {
  if (cleared.length) {
    await vehicles(ctx).updateCustomerVehicles(cleared.map((id) => ({ id, is_default: true })));
  }
};

onEntity("CustomerVehicle", {
  created: { run: async ({ records }, ctx) => keepSingleDefault(ctx, records), compensate: restoreDefaults },
  updated: { run: async ({ records }, ctx) => keepSingleDefault(ctx, records), compensate: restoreDefaults },
});

// Deleting vehicles soft-deletes what points at them: fitments (fitment
// module, id column) and garage entries. Restored if the delete rolls back.
onEntity("Vehicle", {
  deleted: {
    async run({ ids }, ctx) {
      const fitmentSvc = ctx.container.resolve<any>(FITMENT_MODULE);
      const fitments: { id: string }[] = await fitmentSvc.listFitments({ vehicle_id: ids }, { select: ["id"] });
      const garage: { id: string }[] = await vehicles(ctx).listCustomerVehicles({ vehicle_id: ids }, { select: ["id"] });
      if (fitments.length) await fitmentSvc.softDeleteFitments(fitments.map((f) => f.id));
      if (garage.length) await vehicles(ctx).softDeleteCustomerVehicles(garage.map((g) => g.id));
      return { fitments: fitments.map((f) => f.id), garage: garage.map((g) => g.id) };
    },
    async compensate({ fitments, garage }, ctx) {
      if (fitments.length) await ctx.container.resolve<any>(FITMENT_MODULE).restoreFitments(fitments);
      if (garage.length) await vehicles(ctx).restoreCustomerVehicles(garage);
    },
  },
});
