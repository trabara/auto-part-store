import { defineMiddlewares } from "@medusajs/framework";
import { fitmentProductMiddlewares } from "./admin/fitments/middlewares";
import { makesMiddlewares } from "./admin/makes/middlewares";
import { modelsMiddlewares } from "./admin/models/middlewares";
import { enginesMiddlewares } from "./admin/engines/middlewares";
import { productFitmentMiddlewares } from "./admin/products/middlewares";

export default defineMiddlewares({
  routes: [
    ...productFitmentMiddlewares,
    ...fitmentProductMiddlewares,
    ...makesMiddlewares,
    ...modelsMiddlewares,
    ...enginesMiddlewares,
  ],
});
