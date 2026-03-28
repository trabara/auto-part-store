import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from "@medusajs/framework";
import {
  createFindParams
} from "@medusajs/medusa/api/utils/validators";
import { CreatePermissionSchema } from "../../../../modules/rbac/schema";

export const BaseFindParams = createFindParams();

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const adminPermissionsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/permissions",
    method: "GET",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(BaseFindParams, {
        defaults: ["id", "kind", "target", "type", "category_id", "created_at"],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/rbac/permissions",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreatePermissionSchema),
    ],
  },
  {
    matcher: "/admin/rbac/permissions/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
