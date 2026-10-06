import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import PartsModule from "@repo/module-parts";

// part_number.variant_id → product variant, readable as `part_number.variant`.
// Matches `variant: r.link("ProductVariant", { storage: "column" })` on PartNumber.
export default defineLink(
  { linkable: PartsModule.linkable.partNumber, field: "variant_id" },
  { linkable: ProductModule.linkable.productVariant, alias: "variant" },
  { readOnly: true },
);
