import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformBody,
} from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";

export const ClaimCustomerBodySchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
});

export type ClaimCustomerBody = z.infer<typeof ClaimCustomerBodySchema>;

export const customerClaimMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/customers/claim",
    method: "POST",
    middlewares: [
      authenticate("customer", ["bearer"]),
      validateAndTransformBody(ClaimCustomerBodySchema),
    ],
  },
];
