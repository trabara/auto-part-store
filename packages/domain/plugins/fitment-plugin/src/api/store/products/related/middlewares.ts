import { ProductRelatedFindParams } from "@trabara/core/validations";
import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";

export const storeProductRelatedMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/products/related",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(ProductRelatedFindParams, {
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
