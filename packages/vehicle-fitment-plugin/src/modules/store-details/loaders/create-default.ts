import { LoaderOptions } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { STORE_DETAILS_MODULE } from "..";

export default async function createStoreDetailsLoader({
  container,
}: LoaderOptions) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const storeDetailsService = container.resolve<any>(STORE_DETAILS_MODULE);

  try {
    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["id", "store_details.*"],
    });

    if (!stores.length) {
      logger.warn("[store-details] No store found, skipping loader.");
      return;
    }

    const store = stores[0];

    if (store.store_details) {
      return;
    }

    logger.info("[store-details] Creating default store details record...");

    const [details] = await storeDetailsService.createStoreDetailses([
      {
        logo_url: null,
        map_url: null,
        address: null,
        contact_emails: null,
        contact_phone_numbers: null,
        social_links: null,
      },
    ]);

    await link.create({
      [Modules.STORE]: { store_id: store.id },
      [STORE_DETAILS_MODULE]: { store_details_id: details.id },
    });

    logger.info("[store-details] Default store details created and linked.");
  } catch (error) {
    logger.error(`[store-details] Loader failed: ${error.message}`);
  }
}
