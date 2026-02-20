import {
  CreateModelValidationSchema,
  UpdateModelSchema,
} from "@/modules/fitment/schema";
import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { z } from "@medusajs/framework/zod";
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";

const authenticateMiddleware = authenticate(["*"], ["session"]);
const findParams = createFindParams();

const modelFindParams = findParams.extend({
  filters: z
    .object({
      name: createOperatorMap(z.string()).optional(),
      make_id: createOperatorMap(z.string()).optional(),
      make: z
        .object({
          name: createOperatorMap(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
});

export const modelsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/models",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(modelFindParams, {
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
