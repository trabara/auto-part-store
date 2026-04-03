import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import {
  CreateMakeInputSchema,
  MakeFindParamsSchema,
  UpdateMakeInputSchema,
} from "@trabara/core/validations";

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const adminMakesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/makes",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(MakeFindParamsSchema, {
        defaults: ["id", "name", "created_at", "updated_at"],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/makes",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateMakeInputSchema),
    ],
  },
  {
    matcher: "/admin/makes",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(
        z.object({
          makes: z.array(UpdateMakeInputSchema),
        }),
      ),
    ],
  },
  {
    matcher: "/admin/makes/:id",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/makes/:id",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateMakeInputSchema),
    ],
  },
  {
    matcher: "/admin/makes/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
