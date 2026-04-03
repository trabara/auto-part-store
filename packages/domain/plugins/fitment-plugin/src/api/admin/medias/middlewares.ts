import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework";
import {
  CreateEntityImagesSchema,
  DeleteEntityImagesSchema,
  UpdateEntityImagesSchema,
} from "@trabara/core/validations";

const authenticateMiddleware = authenticate(["*"], ["session"]);
export const adminEntityMediaMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/medias/:entity_id/images",
    method: ["POST"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateEntityImagesSchema),
    ],
  },
  {
    matcher: "/admin/medias/:entity_id/images/batch",
    method: ["POST"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateEntityImagesSchema),
    ],
  },
  {
    matcher: "/admin/medias/:entity_id/images/batch",
    method: ["DELETE"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(DeleteEntityImagesSchema),
    ],
  },
];
