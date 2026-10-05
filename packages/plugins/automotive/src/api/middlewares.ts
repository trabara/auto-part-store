import { defineMiddlewares } from "@medusajs/framework";
import { automotiveRoutes } from "./admin/automotive/entities";

export default defineMiddlewares({
  routes: [...automotiveRoutes.middlewares("/admin/automotive")],
});
