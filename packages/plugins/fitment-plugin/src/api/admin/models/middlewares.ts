import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import {
  CreateModelInputSchema,
  ModelFindParamsSchema,
  UpdateModelInputSchema,
} from "../../../modules/fitment/schema";

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const adminModelsMiddlewares: MiddlewareRoute[] = [
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
      validateAndTransformBody(CreateModelInputSchema),
    ],
  },
  {
    matcher: "/admin/models",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(
        z.object({
          models: z.array(UpdateModelInputSchema),
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
      validateAndTransformBody(UpdateModelInputSchema),
    ],
  },
  {
    matcher: "/admin/models/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
