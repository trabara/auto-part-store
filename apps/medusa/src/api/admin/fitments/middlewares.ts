import { CreateFitmentSchema, LinkProductsSchema } from "@/modules/fitment/schema";
import { authenticate, MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const adminFitmentProductMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/fitments",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/fitments",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateFitmentSchema),
    ],
  },
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
