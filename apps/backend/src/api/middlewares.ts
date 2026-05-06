import { defineMiddlewares } from "@medusajs/framework/http";
import { adminStoreDetailsMiddlewares } from "./admin/stores/details/middlewares";

export default defineMiddlewares({
  routes: [...adminStoreDetailsMiddlewares],
});
