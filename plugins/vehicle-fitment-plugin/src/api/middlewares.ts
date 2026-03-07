import { defineMiddlewares } from "@medusajs/framework";
import { adminEnginesMiddlewares } from "./admin/engines/middlewares";
import { adminFitmentProductMiddlewares } from "./admin/fitments/middlewares";
import { adminMakesMiddlewares } from "./admin/makes/middlewares";
import { adminModelsMiddlewares } from "./admin/models/middlewares";
import { adminProductFitmentMiddlewares } from "./admin/products/middlewares";
import { storeEngineMiddlewares } from "./store/engines/middlewares";
import { storeFitmentsMiddlewares } from "./store/fitments/middlewares";
import { storeProductMiddlewares } from "./store/products/v2/middlewares";
import { storeMakeMiddlewares } from "./store/makes/middlewares";

export default defineMiddlewares({
  routes: [
    ...storeProductMiddlewares,
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
