import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import {
  CreateFitmentInputSchema,
  FitmentFindParamsSchema,
  LinkFitmentsInputSchema,
  UpdateFitmentInputSchema,
} from "@trabara/core/validations";

const authenticateMiddleware = authenticate(["*"], ["bearer", "session"]);

export const adminProductFitmentMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/fitments",
    methods: ["POST"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateFitmentInputSchema),
    ],
  },
  {
    matcher: "/admin/fitments/:id",
    methods: ["GET"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/fitments/:id",
    methods: ["DELETE"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/fitments",
    methods: ["PATCH"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateFitmentInputSchema),
    ],
  },
  {
    matcher: "/admin/fitments",
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
