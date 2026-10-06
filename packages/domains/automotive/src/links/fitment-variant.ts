import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import FitmentModule from "@repo/module-fitment";

// fitment.variant_id → product variant, readable as `fitment.variant`.
// Matches `variant: r.link("ProductVariant", { storage: "column" })` on Fitment.
export default defineLink(
  { linkable: FitmentModule.linkable.fitment, field: "variant_id" },
  { linkable: ProductModule.linkable.productVariant, alias: "variant" },
  { readOnly: true },
);
