import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import {
  AssignUsersSchema,
  CreateRoleSchema,
  RoleFiltersSchema,
  UpdateRoleSchema,
} from "@trabara/core/validations";

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const adminRolesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/roles",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
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
      authenticateMiddleware,
      validateAndTransformBody(CreateRoleSchema),
    ],
  },
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
];
