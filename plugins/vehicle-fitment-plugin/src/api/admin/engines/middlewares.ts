import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import {
  CreateEngineInputSchema,
  EngineFindParamsSchema,
  UpdateEngineInputSchema,
} from "../../../modules/fitment/schema";

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const adminEnginesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/engines",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(EngineFindParamsSchema, {
        defaults: [
          "id",
          "fuel",
          "type",
          "size",
          "tech",
          "created_at",
          "updated_at",
        ],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/engines",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateEngineInputSchema),
    ],
  },
  {
    matcher: "/admin/engines",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(
        z.object({
          engines: z.array(UpdateEngineInputSchema),
        }),
      ),
    ],
  },
  {
    matcher: "/admin/engines/:id",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/engines/:id",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateEngineInputSchema),
    ],
  },
  {
    matcher: "/admin/engines/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
