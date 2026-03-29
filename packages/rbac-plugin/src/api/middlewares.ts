import { authenticate, defineMiddlewares, MiddlewareRoute, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { AssignUsersSchema, CreatePermissionSchema, CreateRoleSchema, UpdateRoleSchema } from "../modules/rbac/schema";

const authenticateMiddleware = authenticate(["*"], ["session"]);

const BaseFindParams = createFindParams()

export const adminRolesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/roles/:id",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/rbac/v2/roles/:id",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateRoleSchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/roles/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/rbac/v2/roles/:id/assign",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(AssignUsersSchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/roles",
    method: "GET",
    middlewares: [
      authenticateMiddleware,
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
      authenticateMiddleware,
      validateAndTransformBody(CreateRoleSchema),
    ],
  },

];

export const adminPermissionsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/permissions",
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
    matcher: "/admin/rbac/v2/permissions",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreatePermissionSchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/permissions/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];


export default defineMiddlewares({
  routes: [
    ...adminRolesMiddlewares,
    ...adminPermissionsMiddlewares,
    // ...adminCategoriesMiddlewares,
    // ...adminCheckMiddlewares,
    // ...adminRbacEnforcement,
  ],
});
