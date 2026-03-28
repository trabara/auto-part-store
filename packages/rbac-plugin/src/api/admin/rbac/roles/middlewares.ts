import {
    authenticate,
    MiddlewareRoute,
    validateAndTransformBody,
    validateAndTransformQuery,
} from "@medusajs/framework";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import {
    AssignRoleSchema,
    CreateRoleSchema,
    UpdateRoleSchema,
} from "../../../../modules/rbac/schema";
export const BaseFindParams = createFindParams();

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const adminRolesMiddlewares: MiddlewareRoute[] = [
    {
        matcher: "/admin/rbac/roles*",
        methods: ["GET","POST"],
        middlewares: [
            authenticateMiddleware,
            validateAndTransformQuery(BaseFindParams, {
                defaults: ["id", "name", "description", "is_default", "created_at"],
                isList: true,
            }),
        ],
    },
    {
        matcher: "/admin/rbac/roles*",
        method: "POST",
        middlewares: [
            authenticateMiddleware,
            validateAndTransformBody(CreateRoleSchema),
        ],
    },
    {
        matcher: "/admin/rbac/roles/:id",
        method: "GET",
        middlewares: [authenticateMiddleware],
    },
    {
        matcher: "/admin/rbac/roles/:id",
        method: "PATCH",
        middlewares: [
            authenticateMiddleware,
            validateAndTransformBody(UpdateRoleSchema),
        ],
    },
    {
        matcher: "/admin/rbac/roles/:id",
        method: "DELETE",
        middlewares: [authenticateMiddleware],
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
