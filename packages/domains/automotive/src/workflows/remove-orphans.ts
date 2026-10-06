// Records of this domain pointing at Medusa records (variants, customers) or
// at vehicles through id columns, not foreign keys: when those are deleted,
// these are soft-deleted too, through the framework's delete step (hooks and
// compensation included).
import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { deleteEntitiesStep } from "@repo/framework/entity/server";
import { FITMENT_MODULE, type FitmentModuleService } from "@repo/module-fitment";
import { PARTS_MODULE, type PartsModuleService } from "@repo/module-parts";
import { VEHICLE_MODULE, type VehicleModuleService } from "@repo/module-vehicle";

/** Ids to soft-delete, per entity. */
export type OrphanIds = { fitments: string[]; partNumbers: string[]; garage: string[] };

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);
const unique = (values: string[]) => [...new Set(values)];

/** Ids among `candidates` that have no live record of `entity`. */
async function missing(container: MedusaContainer, entity: string, candidates: string[]) {
  if (!candidates.length) return [];
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({ entity, fields: ["id"], filters: { id: candidates } });
  const live = new Set(ids(data as { id: string }[]));
  return candidates.filter((id) => !live.has(id));
}

/** Variant ids of products (deleted ones included). */
async function variantsOfProducts(container: MedusaContainer, productIds: string[]) {
  if (!productIds.length) return [];
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "product_variant",
    fields: ["id"],
    filters: { product_id: productIds },
    withDeleted: true,
  });
  return ids(data as { id: string }[]);
}

export type FindOrphansInput = {
  /** Records of these deleted variants (and of the variants of these products). */
  variant_ids?: string[];
  product_ids?: string[];
  /** Garage entries of these deleted customers. */
  customer_ids?: string[];
  /** Every record whose variant, vehicle or customer is gone (one-off cleanup). */
  all?: boolean;
};

export const findOrphansStep = createStep(
  "automotive-find-orphans",
  async (input: FindOrphansInput, { container }): Promise<StepResponse<OrphanIds>> => {
    const fitments = container.resolve<FitmentModuleService>(FITMENT_MODULE);
    const parts = container.resolve<PartsModuleService>(PARTS_MODULE);
    const vehicles = container.resolve<VehicleModuleService>(VEHICLE_MODULE);

    if (input.all) {
      const allFitments = await fitments.listFitments({}, { select: ["id", "variant_id", "vehicle_id"] });
      const allNumbers = await parts.listPartNumbers({}, { select: ["id", "variant_id"] });
      const garage = await vehicles.listCustomerVehicles({}, { select: ["id", "customer_id", "vehicle_id"] });
      const variantIds = unique([...allFitments, ...allNumbers].map((r) => r.variant_id));
      const goneVariants = new Set(await missing(container, "product_variant", variantIds));
      const goneVehicles = new Set(
        await missing(container, "vehicle", unique([...allFitments, ...garage].map((r) => r.vehicle_id))),
      );
      const goneCustomers = new Set(await missing(container, "customer", unique(garage.map((r) => r.customer_id))));
      return new StepResponse({
        fitments: ids(allFitments.filter((f) => goneVariants.has(f.variant_id) || goneVehicles.has(f.vehicle_id))),
        partNumbers: ids(allNumbers.filter((n) => goneVariants.has(n.variant_id))),
        garage: ids(garage.filter((g) => goneCustomers.has(g.customer_id) || goneVehicles.has(g.vehicle_id))),
      });
    }

    const variantIds = unique([
      ...(input.variant_ids ?? []),
      ...(await variantsOfProducts(container, input.product_ids ?? [])),
    ]);
    const customerIds = input.customer_ids ?? [];
    return new StepResponse({
      fitments: variantIds.length ? ids(await fitments.listFitments({ variant_id: variantIds }, { select: ["id"] })) : [],
      partNumbers: variantIds.length
        ? ids(await parts.listPartNumbers({ variant_id: variantIds }, { select: ["id"] }))
        : [],
      garage: customerIds.length
        ? ids(await vehicles.listCustomerVehicles({ customer_id: customerIds }, { select: ["id"] }))
        : [],
    });
  },
);

/** Soft-deletes the orphans `input` selects; returns how many of each. */
export const removeOrphansWorkflow = createWorkflow("automotive-remove-orphans", (input: FindOrphansInput) => {
  const found = findOrphansStep(input);

  when("automotive-orphan-fitments", found, (f) => f.fitments.length > 0).then(() => {
    deleteEntitiesStep(
      transform({ found }, ({ found }) => ({ module: FITMENT_MODULE, entity: "Fitment", ids: found.fitments })),
    ).config({ name: "automotive-delete-orphan-fitments" });
  });
  when("automotive-orphan-part-numbers", found, (f) => f.partNumbers.length > 0).then(() => {
    deleteEntitiesStep(
      transform({ found }, ({ found }) => ({ module: PARTS_MODULE, entity: "PartNumber", ids: found.partNumbers })),
    ).config({ name: "automotive-delete-orphan-part-numbers" });
  });
  when("automotive-orphan-garage", found, (f) => f.garage.length > 0).then(() => {
    deleteEntitiesStep(
      transform({ found }, ({ found }) => ({ module: VEHICLE_MODULE, entity: "CustomerVehicle", ids: found.garage })),
    ).config({ name: "automotive-delete-orphan-garage" });
  });

  return new WorkflowResponse(
    transform({ found }, ({ found }) => ({
      fitments: found.fitments.length,
      partNumbers: found.partNumbers.length,
      garage: found.garage.length,
    })),
  );
});
