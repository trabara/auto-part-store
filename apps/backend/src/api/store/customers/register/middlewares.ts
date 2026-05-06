import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";

export const RegisterCustomerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
});

export type RegisterCustomerBody = z.infer<typeof RegisterCustomerSchema>;

export const customerRegisterMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/customers/register",
    method: "POST",
    middlewares: [validateAndTransformBody(RegisterCustomerSchema)],
  },
];
