import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MemberFiltersSchema } from "@trabara/core/validations";

const authenticateMiddleware = authenticate(["*"], ["bearer", "session"]);

export const adminMembersMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/members",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
      validateAndTransformQuery(MemberFiltersSchema, {
        defaults: ["id", "user_id", "role_id", "created_at"],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/rbac/v2/members/:id",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/rbac/v2/members/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
