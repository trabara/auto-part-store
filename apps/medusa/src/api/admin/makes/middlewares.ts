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
  CreateMakeSchema,
  UpdateMakeSchema,
} from "../../../modules/fitment/schema";

const findParams = createFindParams();
const makeFindParams = findParams.extend({
  filters: z
    .object({
      name: createOperatorMap(z.string()).optional(),
    })
    .optional(),
});

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const makesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/makes",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(makeFindParams, {
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
      validateAndTransformBody(CreateMakeSchema),
    ],
  },
  {
    matcher: "/admin/makes",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(
        z.object({
          makes: z.array(UpdateMakeSchema),
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
      validateAndTransformBody(UpdateMakeSchema.omit({ id: true })),
    ],
  },
  {
    matcher: "/admin/makes/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
