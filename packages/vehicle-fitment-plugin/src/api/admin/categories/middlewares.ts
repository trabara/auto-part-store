import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { CreateCategoryImagesSchema, DeleteCategoryImagesSchema, UpdateCategoryImagesSchema } from "../../../modules/category-media/schema";

export const adminCategoriesMiddlewares: MiddlewareRoute[] = [
    {
        matcher: "/admin/categories/:category_id/images",
        method: ["POST"],
        middlewares: [
            validateAndTransformBody(CreateCategoryImagesSchema),
        ],
    },
    {
        matcher: "/admin/categories/:category_id/images/batch",
        method: ["POST"],
        middlewares: [
            validateAndTransformBody(UpdateCategoryImagesSchema),
        ],
    },
    {
        matcher: "/admin/categories/:category_id/images/batch",
        method: ["DELETE"],
        middlewares: [
            validateAndTransformBody(DeleteCategoryImagesSchema),
        ],
    },

]