import { defineMiddlewares } from "@medusajs/framework";
import { authenticate, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http";
import { automotiveRoutes } from "./admin/automotive/entities";
import { partsRoutes } from "./admin/parts/entities";
import { GarageCreateSchema, GarageUpdateSchema } from "./store/garage/helpers";
import {
  StorePartSearchParams,
  StorePartsParams,
  StoreSelectorParams,
  StoreVehiclePartsParams,
} from "./store/automotive/validators";

const query = (schema: Parameters<typeof validateAndTransformQuery>[0]) => validateAndTransformQuery(schema, {});

export default defineMiddlewares({
  routes: [
    ...automotiveRoutes.middlewares("/admin/automotive"),
    ...partsRoutes.middlewares("/admin/parts"),
    // Customer garage: logged-in customers only, scoped to themselves.
    { matcher: "/store/garage*", middlewares: [authenticate("customer", ["session", "bearer"])] },
    { matcher: "/store/garage", methods: ["POST"], middlewares: [validateAndTransformBody(GarageCreateSchema)] },
    { matcher: "/store/garage/:id", methods: ["PUT"], middlewares: [validateAndTransformBody(GarageUpdateSchema)] },
    { matcher: "/store/garage/:id/parts", methods: ["GET"], middlewares: [query(StorePartsParams)] },
    // Public catalog for the storefront (publishable key required by Medusa).
    { matcher: "/store/automotive/makes", methods: ["GET"], middlewares: [query(StoreSelectorParams)] },
    { matcher: "/store/automotive/models", methods: ["GET"], middlewares: [query(StoreSelectorParams)] },
    { matcher: "/store/automotive/generations", methods: ["GET"], middlewares: [query(StoreSelectorParams)] },
    { matcher: "/store/automotive/vehicles", methods: ["GET"], middlewares: [query(StoreSelectorParams)] },
    { matcher: "/store/automotive/vehicles/:id/parts", methods: ["GET"], middlewares: [query(StoreVehiclePartsParams)] },
    { matcher: "/store/automotive/parts/search", methods: ["GET"], middlewares: [query(StorePartSearchParams)] },
  ],
});
