import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import { authenticate } from "@medusajs/framework";

export const LinkFitmentsSchema = z.object({
  fitment_ids: z
    .array(z.string())
    .min(1, "At least one fitment ID is required"),
});

export type LinkFitmentsSchema = z.infer<typeof LinkFitmentsSchema>;

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const productFitmentMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/products/:id/fitments",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/products/:id/fitments",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(LinkFitmentsSchema),
    ],
  },
  {
    matcher: "/admin/products/:id/fitments/:fitmentId",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
