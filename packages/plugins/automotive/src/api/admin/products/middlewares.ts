import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import {
  CreateVehicleInputSchema,
  FitmentFindParamsSchema,
  LinkFitmentsInputSchema,
  UpdateVehicleInputSchema,
} from "../../../modules/fitment/dto";

const authenticateMiddleware = authenticate(["*"], ["bearer", "session"]);

export const adminProductFitmentMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/vehicles",
    methods: ["POST"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateVehicleInputSchema),
    ],
  },
  {
    matcher: "/admin/vehicles/:id",
    methods: ["GET"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/vehicles/:id",
    methods: ["DELETE"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/vehicles",
    methods: ["PATCH"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateVehicleInputSchema),
    ],
  },
  {
    matcher: "/admin/vehicles",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(FitmentFindParamsSchema, {
        defaults: [
          "id",
          "model",
          "engine",
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
    matcher: "/admin/products/:id/fitments",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/products/:id/fitments",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(LinkFitmentsInputSchema),
    ],
  },
  {
    matcher: "/admin/products/:id/fitments/:fitmentId",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
