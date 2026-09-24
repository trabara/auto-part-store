import {
  MiddlewareRoute,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { FitmentFindParamsSchema } from "../../../modules/fitment/dto";

export const storeFitmentsMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/vehicles/:id",
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
          "updated_at",
        ],
      }),
    ],
  },
  {
    matcher: "/store/vehicles",
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
          "updated_at",
        ],
        isList: true,
      }),
    ],
  },
];
