import { z } from "@medusajs/framework/zod";
import { defineEntity } from "@repo/framework/entity";

/**
 * Medusa's product variant, described for links and pickers (no model here):
 * fitments point at the sellable SKU.
 */
export const ProductVariant = defineEntity("ProductVariant", {
  schema: z.object({
    id: z.string(),
    title: z.string(),
    sku: z.string().nullable(),
  }),
  // "Brake pad set · Front (BP-123)"
  label: {
    fields: ["title", "sku", "product.title"],
    format: (v) => {
      const name = [v.product?.title, v.title].filter(Boolean).join(" · ");
      return v.sku ? `${name} (${v.sku})` : name;
    },
  },
  external: { module: "product", url: "/admin/product-variants" },
});
