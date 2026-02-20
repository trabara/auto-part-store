import { LinkProductsSchema } from "@/modules/fitment/schema";
import { authenticate, MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";

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
