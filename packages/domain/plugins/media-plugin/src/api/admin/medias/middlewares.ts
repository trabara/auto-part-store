import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework";
import {
  CreateMediasSchema,
  DeleteMediasSchema,
  UpdateMediasSchema,
} from "@trabara/core/validations";

const authenticateMiddleware = authenticate(["*"], ["bearer", "session"]);
export const adminMediaMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/medias/:entity_id/images",
    method: ["GET"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/medias/:entity_id/images",
    method: ["POST"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateMediasSchema),
    ],
  },
  {
    matcher: "/admin/medias/:entity_id/images/batch",
    method: ["POST"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateMediasSchema),
    ],
  },
  {
    matcher: "/admin/medias/:entity_id/images/batch",
    method: ["DELETE"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(DeleteMediasSchema),
    ],
  },
];
