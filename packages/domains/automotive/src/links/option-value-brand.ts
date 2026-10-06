import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import PartsModule from "@repo/module-parts";

// product option value → brand (brand.option_value_id), so a variant's brand
// reads as `variant.options.brand` in query.graph (storefront, admin).
export default defineLink(
  { linkable: ProductModule.linkable.productOptionValue, field: "id" },
  { ...PartsModule.linkable.brand.id, primaryKey: "option_value_id" },
  { readOnly: true },
);
