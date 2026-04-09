import {
  MiddlewareRoute,
  validateAndTransformQuery
} from "@medusajs/framework";
import { MemberFiltersSchema } from "@trabara/core/validations";

export const adminMembersMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/members",
    methods: ["GET"],
    middlewares: [
      validateAndTransformQuery(MemberFiltersSchema, {
        defaults: ["id", "user_id", "role_id", "created_at"],
        isList: true,
      }),
    ],
  },
  {
    matcher: "/admin/rbac/v2/members/:id",
    method: "GET",
    middlewares: [],
  },
  {
    matcher: "/admin/rbac/v2/members/:id",
    method: "DELETE",
    middlewares: [],
  },
];
