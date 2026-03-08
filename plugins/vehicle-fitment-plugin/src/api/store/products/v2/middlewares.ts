import { ProductV2FindParams } from "../../../../modules/fitment/schema";
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
