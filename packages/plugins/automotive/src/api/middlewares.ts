import { defineMiddlewares } from "@medusajs/framework";

import { adminEnginesMiddlewares } from "./admin/engines/middlewares";
import { adminFitmentProductMiddlewares } from "./admin/vehicles/middlewares";
import { adminMakesMiddlewares } from "./admin/makes/middlewares";
import { adminModelsMiddlewares } from "./admin/models/middlewares";
import { adminProductFitmentMiddlewares } from "./admin/products/middlewares";
import { storeEngineMiddlewares } from "./store/engines/middlewares";
import { storeFitmentsMiddlewares } from "./store/vehicles/middlewares";
import { storeMakeMiddlewares } from "./store/makes/middlewares";
import { storeProductRelatedMiddlewares } from "./store/products/related/middlewares";
import { storeProductSearchMiddlewares } from "./store/products/search/middlewares";
import { storeProductMiddlewares } from "./store/products/v2/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminEnginesMiddlewares,
    ...adminFitmentProductMiddlewares,
    ...adminMakesMiddlewares,
    ...adminModelsMiddlewares,
    ...adminProductFitmentMiddlewares,
    ...storeEngineMiddlewares,
    ...storeFitmentsMiddlewares,
    ...storeMakeMiddlewares,
    ...storeProductMiddlewares,
    ...storeProductRelatedMiddlewares,
    ...storeProductSearchMiddlewares,
  ],
});
