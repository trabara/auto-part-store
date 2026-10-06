import { defineMiddlewares } from "@medusajs/framework";
import { automotiveRoutes } from "./admin/automotive/entities";
import { partsRoutes } from "./admin/parts/entities";

export default defineMiddlewares({
  routes: [
    ...automotiveRoutes.middlewares("/admin/automotive"),
    ...partsRoutes.middlewares("/admin/parts"),
  ],
});
