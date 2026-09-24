import { defineMiddlewares } from "@medusajs/framework";
import { adminOAuthProvidersMiddlewares } from "./admin/oauth-providers/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminOAuthProvidersMiddlewares,
  ],
});
