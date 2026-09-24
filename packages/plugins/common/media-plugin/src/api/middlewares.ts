import { defineMiddlewares } from "@medusajs/framework";

import { adminMediaMiddlewares } from "./admin/medias/middlewares";

export default defineMiddlewares({
  routes: [
    ...adminMediaMiddlewares,
  ],
});
