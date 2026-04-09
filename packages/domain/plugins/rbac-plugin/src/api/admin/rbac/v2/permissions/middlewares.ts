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

export const adminPermissionsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/permissions",
    methods: ["GET"],
    middlewares: [
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
      validateAndTransformBody(CreatePermissionSchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/permissions/:id",
    method: "GET",
    middlewares: [],
  },
  {
    matcher: "/admin/rbac/v2/permissions/:id",
    method: "PATCH",
    middlewares: [
      validateAndTransformBody(UpdatePermissionSchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/permissions/:id",
    method: "DELETE",
    middlewares: [],
  },
];
