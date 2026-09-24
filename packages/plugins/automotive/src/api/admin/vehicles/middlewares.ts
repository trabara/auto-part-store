import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import {
  CreateVehicleInputSchema,
  FitmentFindParamsSchema,
  LinkProductsInputSchema,
  UpdateVehicleInputSchema,
} from "../../../modules/fitment/dto";

const authenticateMiddleware = authenticate(["*"], ["bearer", "session"]);

export const adminFitmentProductMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/vehicles",
    method: "GET",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(FitmentFindParamsSchema, {
        defaults: [
          "id",
          "body_style",
          "doors",
          "drive",
          "transmission",
          "year_start",
          "year_end",
        ],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/vehicles",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateVehicleInputSchema),
    ],
  },
  {
    matcher: "/admin/vehicles/:id",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateVehicleInputSchema),
    ],
  },
  {
    matcher: "/admin/vehicles/:id/products",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/vehicles/:id/products",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(LinkProductsInputSchema),
    ],
  },
  {
    matcher: "/admin/vehicles/:id/products/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
