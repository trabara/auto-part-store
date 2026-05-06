import { defineMiddlewares } from "@medusajs/framework/http";
import { adminStoreDetailsMiddlewares } from "./admin/stores/details/middlewares";
import { customerExistsMiddlewares } from "./store/customers/exists/middlewares";
import { customerRegisterMiddlewares } from "./store/customers/register/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminStoreDetailsMiddlewares,
    ...customerExistsMiddlewares,
    ...customerRegisterMiddlewares,
  ],
});
