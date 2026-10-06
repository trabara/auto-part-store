/**
 * Medusa's own models, described as external entities (no models here) so
 * any module can link to them and the admin can pick them. Isomorphic.
 *
 * ```ts
 * import { ProductVariant } from "@repo/framework/medusa"
 * relations: (r) => ({ variant: r.link("ProductVariant", { storage: "column" }) })
 * ```
 */
import { z } from "@medusajs/framework/zod"
import { defineEntity } from "../entity"

/** The sellable SKU: fitments and part numbers point at it. */
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

/** A value of a product option; brands own the values of the shared "Brand" option. */
export const ProductOptionValue = defineEntity("ProductOptionValue", {
  schema: z.object({ id: z.string(), value: z.string() }),
  display: "value",
  external: { module: "product", url: "/admin/product-options" },
});

/** A storefront customer: owns garage vehicles. */
export const Customer = defineEntity("Customer", {
  schema: z.object({
    id: z.string(),
    email: z.string(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
  }),
  // "Jane Doe <jane@example.com>"
  label: {
    fields: ["email", "first_name", "last_name"],
    format: (c) => {
      const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
      return name ? `${name} <${c.email}>` : (c.email ?? "");
    },
  },
  external: { module: "customer", url: "/admin/customers" },
});

declare module "../entity" {
  interface EntityRegistry {
    Customer: typeof Customer;
    ProductVariant: typeof ProductVariant;
    ProductOptionValue: typeof ProductOptionValue;
  }
}
