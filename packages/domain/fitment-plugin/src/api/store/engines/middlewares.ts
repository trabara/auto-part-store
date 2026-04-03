import { EngineFindParamsSchema } from "@trabara/core/validations";
import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";

export const storeEngineMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/engines",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(EngineFindParamsSchema, {
        defaults: ["id", "name", "type", "created_at", "updated_at"],
        isList: true,
      }),
    ],
  },
];
