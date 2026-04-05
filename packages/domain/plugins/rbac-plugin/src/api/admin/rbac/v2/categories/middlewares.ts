import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import {
  CategoryFiltersSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from "@trabara/core/validations";

const authenticateMiddleware = authenticate(["*"], ["session"]);

export const adminCategoriesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/categories",
    methods: ["GET"],
    middlewares: [
      authenticateMiddleware,
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
      authenticateMiddleware,
      validateAndTransformBody(CreateCategorySchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/categories/:id",
    method: "GET",
    middlewares: [authenticateMiddleware],
  },
  {
    matcher: "/admin/rbac/v2/categories/:id",
    method: "PATCH",
    middlewares: [
      authenticateMiddleware,
      validateAndTransformBody(UpdateCategorySchema),
    ],
  },
  {
    matcher: "/admin/rbac/v2/categories/:id",
    method: "DELETE",
    middlewares: [authenticateMiddleware],
  },
];
