import {
  defineMiddlewares,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from "@medusajs/framework";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { rbacMiddleware } from "../modules/authz";
import {
  AssignUsersSchema,
  CreatePermissionSchema,
  CreateRoleSchema,
  UpdateRoleSchema,
} from "../modules/authz/schema";


const BaseFindParams = createFindParams();

export const adminRolesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/roles/:id",
    method: "GET",
    middlewares: [

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
  {
    matcher: "/admin/rbac/v2/roles",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(BaseFindParams, {
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
];

export const adminPermissionsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/permissions",
    method: "GET",
    middlewares: [
      validateAndTransformQuery(BaseFindParams, {
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
    method: "DELETE",
    middlewares: [rbacMiddleware],  
  },
];

export default defineMiddlewares({
  routes: [
    ...adminRolesMiddlewares,
    ...adminPermissionsMiddlewares,
    {
      matcher: "/admin/*",
      method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      middlewares: [rbacMiddleware],
    }
  ],
});
