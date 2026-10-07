// Storefront product cards for a set of variants: only published products in
// the publishable key's sales channels, with prices (region), stock and brand.
import type { MedusaStoreRequest } from "@medusajs/framework/http";
import { applyTranslations, ContainerRegistrationKeys, MedusaError, Modules, QueryContext } from "@medusajs/framework/utils";
import { wrapVariantsWithInventoryQuantityForSalesChannel } from "@medusajs/medusa/api/utils/middlewares/index";

export type ProductFilters = {
  region_id?: string;
  category_id?: string | string[];
  brand_id?: string;
};

export type Page = { limit: number; offset: number };

const VARIANT_FIELDS = [
  "id",
  "title",
  "sku",
  "manage_inventory",
  "product.id",
  "product.title",
  "product.handle",
  "product.thumbnail",
  "options.brand.id",
  "options.brand.name",
  "options.brand.logo",
];

/** Pricing context from `region_id` (currency from the region). */
async function pricingContext(req: MedusaStoreRequest<unknown>, regionId?: string) {
  if (!regionId) return undefined;
  const region = await req.scope.resolve<any>(Modules.REGION).listRegions({ id: regionId }, { select: ["id", "currency_code"] });
  if (!region.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Region "${regionId}" not found`);
  return { region_id: region[0].id, currency_code: region[0].currency_code };
}

/**
 * Products (with only the given variants) for the storefront, paged by
 * product. `extra(variantId)` adds per-variant data (fitments, match info).
 */
export async function storeProducts<X extends object>(
  req: MedusaStoreRequest<unknown>,
  variantIds: string[],
  filters: ProductFilters,
  page: Page,
  extra: (variantId: string) => X,
) {
  if (!variantIds.length) return { products: [], count: 0, ...page };
  const query = req.scope.resolve<any>(ContainerRegistrationKeys.QUERY);
  const pricing = await pricingContext(req, filters.region_id);
  const salesChannels = req.publishable_key_context?.sales_channel_ids ?? [];

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: pricing ? [...VARIANT_FIELDS, "calculated_price.*"] : VARIANT_FIELDS,
    filters: {
      id: variantIds,
      product: {
        status: "published",
        ...(salesChannels.length ? { sales_channels: { id: salesChannels } } : {}),
        ...(filters.category_id ? { categories: { id: filters.category_id } } : {}),
      },
    },
    ...(pricing ? { context: { calculated_price: QueryContext(pricing) } } : {}),
  });
  if (salesChannels.length) await wrapVariantsWithInventoryQuantityForSalesChannel(req, variants);

  // Brand: the variant's value of the shared "Brand" option.
  const cards = (variants as any[])
    .map(({ options, product, ...variant }) => ({
      product,
      variant: { ...variant, brand: options?.find((o: any) => o.brand)?.brand ?? null, ...extra(variant.id) },
    }))
    .filter(({ variant }) => !filters.brand_id || variant.brand?.id === filters.brand_id);

  const byProduct = new Map<string, any>();
  for (const { product, variant } of cards) {
    const entry = byProduct.get(product.id) ?? { ...product, variants: [] };
    entry.variants.push(variant);
    byProduct.set(product.id, entry);
  }
  const products = [...byProduct.values()].sort((a, b) => a.title.localeCompare(b.title));
  const pageItems = products.slice(page.offset, page.offset + page.limit);
  // Translatable fields in the request's locale (Medusa's Translation module:
  // products, variants and ours, e.g. fitment positions and notes). A no-op
  // without a locale or with the `translation` feature flag off.
  await applyTranslations({ localeCode: req.locale, objects: pageItems, container: req.scope as any });
  return { products: pageItems, count: products.length, ...page };
}
