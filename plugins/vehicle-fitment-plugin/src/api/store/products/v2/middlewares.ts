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
          "variants",
          "tags",
          "metadata",
        ],
        isList: true,
      }),
    ],
  },
];
