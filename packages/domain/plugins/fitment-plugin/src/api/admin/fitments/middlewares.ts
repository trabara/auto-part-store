import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import {
  CreateFitmentInputSchema,
  FitmentFindParamsSchema,
  LinkProductsInputSchema,
  UpdateFitmentInputSchema,
} from "@trabara/core/validations";

const authenticateMiddleware = authenticate(["*"], ["bearer", "session"]);

export const adminFitmentProductMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/fitments",
    method: "GET",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(FitmentFindParamsSchema, {
        defaults: ['id', "body_style", 'doors', "drive", "transmission", "year_start", "year_end"], 
        isList: true
      }),
    ],
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
