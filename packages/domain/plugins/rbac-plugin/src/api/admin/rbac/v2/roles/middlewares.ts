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
  UpdateRolePoliciesSchema,
  UpdateRoleSchema,
} from "@trabara/core/validations";

const authenticateMiddleware = authenticate(["*"], ["bearer", "session"]);

export const adminRolesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/roles",
    methods: ["GET"],
    middlewares: [
      validateAndTransformQuery(RoleFiltersSchema, {
        defaults: [
          "id",
          "name",
          "description",
          "is_default",
          "created_at",
          "updated_at",
        ],
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
    method: "GET",
    middlewares: [],
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
    middlewares: [],
  },
  {
    matcher: "/admin/rbac/v2/roles/:id/assign",
    method: "POST",
    middlewares: [
      validateAndTransformBody(AssignUsersSchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/roles/:id/policies",
    method: "PATCH",
    middlewares: [
      validateAndTransformBody(UpdateRolePoliciesSchema),
    ],
  },
];
