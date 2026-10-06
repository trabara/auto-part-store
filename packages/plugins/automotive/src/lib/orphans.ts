// Records in this plugin that point at Medusa records (variants, customers)
// through id columns, not foreign keys: when those are deleted elsewhere,
// these are soft-deleted too, through the framework's delete workflow.
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { deleteEntitiesWorkflow } from "@repo/framework/entity/server";
import { FITMENT_MODULE } from "../modules/fitment";
import { PARTS_MODULE } from "../modules/parts";
import { VEHICLE_MODULE } from "../modules/vehicle";

type Container = { resolve: <T = any>(key: string) => T };

async function softDelete(container: Container, module: string, entity: string, ids: string[]) {
  if (!ids.length) return 0;
  await deleteEntitiesWorkflow(container as any).run({ input: { module, entity, ids } });
  return ids.length;
}

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

/** Fitments and part numbers of deleted variants. */
export async function removeVariantRecords(container: Container, variantIds: string[]) {
  if (!variantIds.length) return { fitments: 0, partNumbers: 0 };
  const fitments = await container.resolve<any>(FITMENT_MODULE).listFitments({ variant_id: variantIds }, { select: ["id"] });
  const numbers = await container.resolve<any>(PARTS_MODULE).listPartNumbers({ variant_id: variantIds }, { select: ["id"] });
  return {
    fitments: await softDelete(container, FITMENT_MODULE, "Fitment", ids(fitments)),
    partNumbers: await softDelete(container, PARTS_MODULE, "PartNumber", ids(numbers)),
  };
}

/** Garage entries of deleted customers. */
export async function removeCustomerRecords(container: Container, customerIds: string[]) {
  if (!customerIds.length) return { garage: 0 };
  const garage = await container.resolve<any>(VEHICLE_MODULE).listCustomerVehicles({ customer_id: customerIds }, { select: ["id"] });
  return { garage: await softDelete(container, VEHICLE_MODULE, "CustomerVehicle", ids(garage)) };
}

/** Variant ids of products (deleted ones included). */
export async function variantsOfProducts(container: Container, productIds: string[]) {
  if (!productIds.length) return [];
  const query = container.resolve<any>(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "product_variant",
    fields: ["id"],
    filters: { product_id: productIds },
    withDeleted: true,
  });
  return ids(data);
}

/** Ids among `candidates` that have no live record of `entity`. */
async function missing(container: Container, entity: string, candidates: string[]) {
  if (!candidates.length) return [];
  const query = container.resolve<any>(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({ entity, fields: ["id"], filters: { id: candidates } });
  const live = new Set(ids(data));
  return candidates.filter((id) => !live.has(id));
}

/** Soft-deletes existing orphans (rows whose variant, vehicle or customer is gone). */
export async function removeOrphans(container: Container) {
  const fitmentSvc = container.resolve<any>(FITMENT_MODULE);
  const vehicleSvc = container.resolve<any>(VEHICLE_MODULE);
  const fitments: { id: string; variant_id: string; vehicle_id: string }[] = await fitmentSvc.listFitments(
    {},
    { select: ["id", "variant_id", "vehicle_id"] },
  );
  const numbers: { id: string; variant_id: string }[] = await container
    .resolve<any>(PARTS_MODULE)
    .listPartNumbers({}, { select: ["id", "variant_id"] });
  const garage: { id: string; customer_id: string; vehicle_id: string }[] = await vehicleSvc.listCustomerVehicles(
    {},
    { select: ["id", "customer_id", "vehicle_id"] },
  );
  const unique = (values: string[]) => [...new Set(values)];

  const goneVariants = new Set(await missing(container, "product_variant", unique([...fitments, ...numbers].map((r) => r.variant_id))));
  const goneVehicles = new Set(await missing(container, "vehicle", unique([...fitments, ...garage].map((r) => r.vehicle_id))));
  const goneCustomers = new Set(await missing(container, "customer", unique(garage.map((r) => r.customer_id))));

  return {
    fitments: await softDelete(
      container, FITMENT_MODULE, "Fitment",
      ids(fitments.filter((f) => goneVariants.has(f.variant_id) || goneVehicles.has(f.vehicle_id))),
    ),
    partNumbers: await softDelete(container, PARTS_MODULE, "PartNumber", ids(numbers.filter((n) => goneVariants.has(n.variant_id)))),
    garage: await softDelete(
      container, VEHICLE_MODULE, "CustomerVehicle",
      ids(garage.filter((g) => goneCustomers.has(g.customer_id) || goneVehicles.has(g.vehicle_id))),
    ),
  };
}
