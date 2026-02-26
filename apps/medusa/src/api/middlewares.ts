import { defineMiddlewares } from "@medusajs/framework";
import { adminEnginesMiddlewares } from "./admin/engines/middlewares";
import { adminFitmentProductMiddlewares } from "./admin/fitments/middlewares";
import { adminMakesMiddlewares } from "./admin/makes/middlewares";
import { adminModelsMiddlewares } from "./admin/models/middlewares";
import { adminProductFitmentMiddlewares } from "./admin/products/middlewares";
import { storeFitmentsMiddlewares } from "./store/fitments/middlewares";
import { storeMakeMiddlewares } from "./store/makes/middlewares";
import { storeEngineMiddlewares } from "./store/engines/middlewares";

export default defineMiddlewares({
  routes: [
    ...storeFitmentsMiddlewares,
    ...storeMakeMiddlewares,
    ...storeEngineMiddlewares,
    ...adminProductFitmentMiddlewares,
    ...adminFitmentProductMiddlewares,
    ...adminMakesMiddlewares,
    ...adminModelsMiddlewares,
    ...adminEnginesMiddlewares,
  ],
});
