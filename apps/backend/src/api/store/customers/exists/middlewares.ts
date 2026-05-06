import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";

export const GetCustomerExistsSchema = z.object({
  email: z.string().email(),
});

export const customerExistsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/customers/exists",
    method: "GET",
    middlewares: [validateAndTransformQuery(GetCustomerExistsSchema, {})],
  },
];
