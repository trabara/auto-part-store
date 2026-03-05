import { CreateFitmentSchema, LinkProductsSchema, UpdateFitmentSchema } from "@/modules/fitment/schema";
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
    matcher: "/admin/fitments/:id",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateFitmentSchema)
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
    matcher: "/admin/fitments/:id/products/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
