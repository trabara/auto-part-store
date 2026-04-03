import { ProductV2FindParams } from "@trabara/core/validations";
import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";

export const storeProductMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/products/v2",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(ProductV2FindParams, {
        defaults: [
          "id",
          "title",
          "subtitle",
          "description",
          "handle",
          "thumbnail",
          "discountable",
          "length",
          "width",
          "height",
          "weight",
          "options",
          "options.id",
          "options.title",
          "options.values",
          "options.values.value",
          "variants",
          "variants.sku",
          "*variants.calculated_price",
          "variants.inventory_quantity",
          "tags",
          "metadata",
        ],
        isList: true,
      }),
    ],
  },
];
