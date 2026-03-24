import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework";
import {
  CreateFitmentInputSchema,
  LinkProductsInputSchema,
  UpdateFitmentInputSchema
} from "../../../modules/fitment/schema";

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
      validateAndTransformBody(CreateFitmentInputSchema),
    ],
  },
  {
    matcher: "/admin/fitments/:id",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateFitmentInputSchema),
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
      validateAndTransformBody(LinkProductsInputSchema),
    ],
  },
  {
    matcher: "/admin/fitments/:id/products/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
