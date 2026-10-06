// Deleting a product, variant or customer (in Medusa's own workflows) also
// soft-deletes this plugin's records pointing at them: fitments and part
// numbers of the variants, garage entries of the customer.
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { removeCustomerRecords, removeVariantRecords, variantsOfProducts } from "../lib/orphans";

export default async function onMedusaDeletion({ event, container }: SubscriberArgs<{ id: string | string[] }>) {
  const ids = ([] as string[]).concat(event.data.id ?? []);
  const logger = container.resolve("logger");
  if (event.name.endsWith("customer.deleted")) {
    const removed = await removeCustomerRecords(container as any, ids);
    if (removed.garage) logger.info(`[automotive] removed ${removed.garage} garage vehicle(s) of deleted customers`);
    return;
  }
  const variantIds = event.name.endsWith("product-variant.deleted") ? ids : await variantsOfProducts(container as any, ids);
  const removed = await removeVariantRecords(container as any, variantIds);
  if (removed.fitments || removed.partNumbers) {
    logger.info(`[automotive] removed ${removed.fitments} fitment(s), ${removed.partNumbers} part number(s) of deleted variants`);
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
