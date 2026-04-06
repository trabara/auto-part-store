import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import {
  CreatePermissionSchema,
  PermissionFiltersSchema,
  UpdatePermissionSchema,
} from "@trabara/core/validations";

const authenticateMiddleware = authenticate(["*"], ["bearer", "session"]);

export const adminPermissionsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/permissions",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(PermissionFiltersSchema, {
        defaults: ["id", "kind", "target", "type", "created_at"],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/rbac/v2/permissions",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreatePermissionSchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/permissions/:id",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/rbac/v2/permissions/:id",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdatePermissionSchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/permissions/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
