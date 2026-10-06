import { defineMiddlewares } from "@medusajs/framework";
import { authenticate, validateAndTransformBody } from "@medusajs/framework/http";
import { automotiveRoutes } from "./admin/automotive/entities";
import { partsRoutes } from "./admin/parts/entities";
import { GarageCreateSchema, GarageUpdateSchema } from "./store/garage/helpers";

export default defineMiddlewares({
  routes: [
    ...automotiveRoutes.middlewares("/admin/automotive"),
    ...partsRoutes.middlewares("/admin/parts"),
    // Customer garage: logged-in customers only, scoped to themselves.
    { matcher: "/store/garage*", middlewares: [authenticate("customer", ["session", "bearer"])] },
    { matcher: "/store/garage", methods: ["POST"], middlewares: [validateAndTransformBody(GarageCreateSchema)] },
    { matcher: "/store/garage/:id", methods: ["PUT"], middlewares: [validateAndTransformBody(GarageUpdateSchema)] },
  ],
});
