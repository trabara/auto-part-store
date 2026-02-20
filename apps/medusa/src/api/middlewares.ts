import { defineMiddlewares, validateAndTransformQuery } from "@medusajs/framework";
import { fitmentProductMiddlewares } from "./admin/fitments/middlewares";
import { makesMiddlewares } from "./admin/makes/middlewares";
import { modelsMiddlewares } from "./admin/models/middlewares";
import { enginesMiddlewares } from "./admin/engines/middlewares";
import { productFitmentMiddlewares } from "./admin/products/middlewares";
import { FitmentFindParamsSchema } from "@/modules/fitment/schema";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/fitments",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(FitmentFindParamsSchema, {
          defaults: ["id", "make_id", "model_id", "engine_id", "created_at", "updated_at"],
          isList: true,
        })
      ],
    },
    ...productFitmentMiddlewares,
    ...fitmentProductMiddlewares,
    ...makesMiddlewares,
    ...modelsMiddlewares,
    ...enginesMiddlewares,
  ],
});
