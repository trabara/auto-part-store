import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

const findParams = createFindParams().extend({
  currency_code: z.string(),
  region_id: z.string(),
  fitment_id: z.string().optional(),
  category_id: z.string().optional(),
});

export const storeProductMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/get-products",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(findParams, {
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
