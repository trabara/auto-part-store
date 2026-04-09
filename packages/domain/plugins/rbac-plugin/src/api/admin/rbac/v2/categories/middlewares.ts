import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from "@medusajs/framework";
import {
  CategoryFiltersSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
} from "@trabara/core/validations";

export const adminCategoriesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/rbac/v2/categories",
    methods: ["GET"],
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
    method: "GET",
    middlewares: [],
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
  },
];
