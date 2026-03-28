import {
  authenticate,
  defineMiddlewares,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import {
  createFindParams
} from "@medusajs/medusa/api/utils/validators";
import {
  AssignRoleSchema,
  CheckAccessSchema,
  CreatePermissionSchema,
  CreateRoleSchema,
  RoleFiltersSchema,
  UpdateRoleSchema
} from "../modules/rbac/schema";

const authenticateMiddleware = authenticate(["*"], ["session", "bearer"]);
export const BaseFindParams = createFindParams();

export const adminRolesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/roles",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(BaseFindParams.merge(RoleFiltersSchema), {
        defaults: ["id", "name", "description", "is_default", "created_at"],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/rbac/roles",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CreateRoleSchema),
    ],
  },
  {
    matcher: "/admin/rbac/roles/:id",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware
    ],
  },
  {
    matcher: "/admin/rbac/roles/:id",
    method: "PUT",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateRoleSchema),
    ],
  },
  {
    matcher: "/admin/rbac/roles/:id",
    method: "DELETE",
    middlewares: [
      authenticateMiddleware
    ],
  },
  {
    matcher: "/admin/rbac/roles/:id/assign",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(AssignRoleSchema),
    ],
  },
];

export const adminPermissionsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/permissions",
    methods: ["GET"],
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

export const adminCategoriesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/categories",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(BaseFindParams, {
        defaults: ["id", "name", "description", "created_at"],
        isList: true,
      }),
    ],
  },
];

export const adminCheckMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/check",
    method: "POST",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(CheckAccessSchema),
    ],
  },
];

export const adminRbacEnforcement: MiddlewareRoute[] = [
  {
    matcher: "/admin/auth/*",
    methods: ["GET", "POST"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/invite/*",
    methods: ["GET", "POST"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/rbac/check",
    methods: ["POST"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/rbac/*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/users/@current",
    methods: ["GET", "PUT"],
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/*",
    methods: ["GET", "POST", "PUT", "DELETE"],
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
  ]
});