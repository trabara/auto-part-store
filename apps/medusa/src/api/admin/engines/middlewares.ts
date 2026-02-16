import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformQuery,
  validateAndTransformBody,
} from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";
import {
  CreateEngineSchema,
  UpdateEngineSchema,
  FuelTypeSchema,
  EngineTypeSchema,
} from "../../../modules/fitment/schema";

const authenticateMiddleware = authenticate(["*"], ["session"]);
const findParams = createFindParams();

const engineFindParams = findParams.extend({
  filters: z
    .object({
      fuel: createOperatorMap(FuelTypeSchema).optional(),
      type: createOperatorMap(EngineTypeSchema).optional(),
      size: createOperatorMap(z.string()).optional(),
      tech: createOperatorMap(z.string()).optional(),
    })
    .optional(),
});

export const enginesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/engines",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(engineFindParams, {
        defaults: ["id", "fuel", "type", "size", "tech", "created_at", "updated_at"],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/engines",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateEngineSchema),
    ],
  },
  {
    matcher: "/admin/engines",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(
        z.object({
          engines: z.array(UpdateEngineSchema),
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
      validateAndTransformBody(UpdateEngineSchema.omit({ id: true })),
    ],
  },
  {
    matcher: "/admin/engines/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
