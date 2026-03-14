import { defineMiddlewares } from "@medusajs/framework";
import { adminEnginesMiddlewares } from "./admin/engines/middlewares";
import { adminFitmentProductMiddlewares } from "./admin/fitments/middlewares";
import { adminMakesMiddlewares } from "./admin/makes/middlewares";
import { adminModelsMiddlewares } from "./admin/models/middlewares";
import { adminProductFitmentMiddlewares } from "./admin/products/middlewares";
import { storeEngineMiddlewares } from "./store/engines/middlewares";
import { storeFitmentsMiddlewares } from "./store/fitments/middlewares";
import { storeProductMiddlewares } from "./store/products/v2/middlewares";
import { storeProductSearchMiddlewares } from "./store/products/search/middlewares";
import { storeProductRelatedMiddlewares } from "./store/products/related/middlewares";
import { storeMakeMiddlewares } from "./store/makes/middlewares";
import { adminCategoriesMiddlewares } from "./admin/categories/middlewares";
import { adminInvoiceMiddlewares } from "./admin/invoice-config/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminCategoriesMiddlewares,
    ...adminEnginesMiddlewares,
    ...adminFitmentProductMiddlewares,
    ...adminInvoiceMiddlewares,
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
