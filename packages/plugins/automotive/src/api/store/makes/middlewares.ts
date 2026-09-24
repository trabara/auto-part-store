import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MakeFindParamsSchema } from "../../../modules/fitment/dto";

export const storeMakeMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/makes",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(MakeFindParamsSchema, {
        defaults: ["id", "name", "created_at", "updated_at"],
        isList: true,
      }),
    ],
  },
];
