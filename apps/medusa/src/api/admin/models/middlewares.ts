import {
  CreateModelValidationSchema,
  ModelFindParamsSchema,
  UpdateModelSchema
} from "@/modules/fitment/schema";
import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const modelsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/models",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(ModelFindParamsSchema, {
        defaults: ["id", "name", "created_at", "updated_at"],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/models",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateModelValidationSchema),
    ],
  },
  {
    matcher: "/admin/models",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(
        z.object({
          models: z.array(UpdateModelSchema),
        }),
      ),
    ],
  },
  {
    matcher: "/admin/models/:id",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/models/:id",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateModelSchema),
    ],
  },
  {
    matcher: "/admin/models/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
