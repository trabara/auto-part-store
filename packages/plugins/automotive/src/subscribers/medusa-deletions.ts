// Deleting a product, variant or customer (in Medusa's own workflows) also
// soft-deletes this domain's records pointing at them: fitments and part
// numbers of the variants, garage entries of the customer.
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { removeOrphansWorkflow, type FindOrphansInput } from "../workflows/remove-orphans";

function orphansOf(event: string, ids: string[]): FindOrphansInput {
  if (event.endsWith("customer.deleted")) return { customer_ids: ids };
  if (event.endsWith("product-variant.deleted")) return { variant_ids: ids };
  return { product_ids: ids };
}

export default async function onMedusaDeletion({ event, container }: SubscriberArgs<{ id: string | string[] }>) {
  const ids = ([] as string[]).concat(event.data.id ?? []);
  if (!ids.length) return;
  const { result } = await removeOrphansWorkflow(container).run({ input: orphansOf(event.name, ids) });
  if (result.fitments || result.partNumbers || result.garage) {
    container.resolve("logger").info(
      `[automotive] removed ${result.fitments} fitment(s), ${result.partNumbers} part number(s), ${result.garage} garage vehicle(s) after ${event.name}`,
    );
  }
}

export const config: SubscriberConfig = {
  // Workflow events and module events (deletes can come from either path).
  event: [
    "product.deleted",
    "product.product.deleted",
    "product-variant.deleted",
    "product.product-variant.deleted",
    "customer.deleted",
    "customer.customer.deleted",
  ],
};
