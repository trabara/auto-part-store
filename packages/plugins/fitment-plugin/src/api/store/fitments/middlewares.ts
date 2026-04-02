import { FitmentFindParamsSchema } from "../../../modules/fitment/schema";
import { MiddlewareRoute, validateAndTransformQuery } from "@medusajs/framework";

export const storeFitmentsMiddlewares: MiddlewareRoute[] = [
    {
        matcher: "/store/fitments/:id",
        method: "GET",
        middlewares: [
            validateAndTransformQuery(FitmentFindParamsSchema, {
                defaults: [
                    "id",
                    "body_style",
                    "doors",
                    "drive",
                    "transmission",
                    "year_start",
                    "year_end",
                    "created_at",
                    "updated_at"
                ],
            })
        ],
    },
    {
        matcher: "/store/fitments",
        method: "GET",
        middlewares: [
            validateAndTransformQuery(FitmentFindParamsSchema, {
                defaults: [
                    "id",
                    "body_style",
                    "doors",
                    "drive",
                    "transmission",
                    "year_start",
                    "year_end",
                    "created_at",
                    "updated_at"
                ],
                isList: true,
            })
        ],
    },
]