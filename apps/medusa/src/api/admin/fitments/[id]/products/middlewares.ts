import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import { authenticate } from "@medusajs/framework";

export const LinkProductsSchema = z.object({
  product_ids: z
    .array(z.string())
    .min(1, "At least one product ID is required"),
});

export type LinkProductsSchema = z.infer<typeof LinkProductsSchema>;

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const fitmentProductMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/fitments/:id/products",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/fitments/:id/products",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(LinkProductsSchema),
    ],
  },
  {
    matcher: "/admin/fitments/:id/products/:productId",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
