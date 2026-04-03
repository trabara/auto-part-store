import {
  defineMiddlewares,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from "@medusajs/framework";
import { rbacMiddleware } from "../modules/authz";
import {
  AssignUsersSchema,
  CategoryFiltersSchema,
  CreateCategorySchema,
  CreatePermissionSchema,
  CreateRoleSchema,
  PermissionFiltersSchema,
  RoleFiltersSchema,
  UpdateCategorySchema,
  UpdatePermissionSchema,
  UpdateRoleSchema,
} from "../modules/authz/schema";

export const adminRolesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/roles/:id",
    method: "GET",
    middlewares: [
    ],
  },
  {
    matcher: "/admin/rbac/v2/roles",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(RoleFiltersSchema, {
        defaults: ["id", "name", "description", "is_default", "created_at"],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/rbac/v2/roles",
    method: "POST",
    middlewares: [
      validateAndTransformBody(CreateRoleSchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/roles/:id",
    method: "PATCH",
    middlewares: [
      validateAndTransformBody(UpdateRoleSchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/roles/:id",
    method: "DELETE",
    middlewares: [

    ],
  },
  {
    matcher: "/admin/rbac/v2/roles/:id/assign",
    method: "POST",
    middlewares: [
      validateAndTransformBody(AssignUsersSchema),
    ],
  },
];

export const adminPermissionsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/permissions/:id",
    method: "GET",
    middlewares: [
    ],
  },
  {
    matcher: "/admin/rbac/v2/permissions",
    method: "GET",
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

export const adminCategoriesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/categories/:id",
    method: "GET",
    middlewares: [
    ],
  },
  {
    matcher: "/admin/rbac/v2/categories",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(CategoryFiltersSchema, {
        defaults: ["id", "name", "description", "created_at"],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/rbac/v2/categories",
    method: "POST",
    middlewares: [
      validateAndTransformBody(CreateCategorySchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/categories/:id",
    method: "PATCH",
    middlewares: [
      validateAndTransformBody(UpdateCategorySchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/categories/:id",
    method: "DELETE",
    middlewares: [],
  }
]
export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin*",
      method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      middlewares: [rbacMiddleware],
    },
    ...adminCategoriesMiddlewares,
    ...adminRolesMiddlewares,
    ...adminPermissionsMiddlewares,
  ],
});
