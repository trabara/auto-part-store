import { ProductSearchParams } from "../../../../modules/fitment/schema";
import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";

export const storeProductSearchMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/products/search",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(ProductSearchParams, {
        defaults: ["id", "title", "handle", "thumbnail"],
        isList: true,
      }),
    ],
  },
];
