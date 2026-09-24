import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { ProductSearchParams } from "../../../../modules/fitment/dto";

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
