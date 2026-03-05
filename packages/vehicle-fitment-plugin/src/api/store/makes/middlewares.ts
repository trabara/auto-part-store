import { MakeFindParamsSchema } from "@/modules/fitment/schema";
import { MiddlewareRoute, validateAndTransformQuery } from "@medusajs/framework";

export const storeMakeMiddlewares: MiddlewareRoute[] = [
    {
        matcher: "/store/makes",
        method: "GET",
        middlewares: [
            validateAndTransformQuery(MakeFindParamsSchema, {
                defaults: [
                    "id",
                    "name",
                    "created_at",
                    "updated_at"
                ],
                isList: true,
            }),
        ]
    }
]