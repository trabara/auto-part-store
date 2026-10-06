import { defineMiddlewares } from "@medusajs/framework";
import { authenticate, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http";
import { ReplaceConditionsSchema } from "../modules/fitment/conditions";
import { FITMENTS_PATH, fitmentRoutes } from "../modules/fitment/http";
import { PARTS_PATH, partsRoutes } from "../modules/parts/http";
import { VEHICLES_PATH, vehicleRoutes } from "../modules/vehicle/http";
import { GarageCreateSchema, GarageUpdateSchema } from "./store/garage/helpers";
import {
  StorePartSearchParams,
  StorePartsParams,
  StoreSelectorParams,
  StoreVehiclePartsParams,
} from "./store/validators";

const query = (schema: Parameters<typeof validateAndTransformQuery>[0]) => validateAndTransformQuery(schema, {});

export default defineMiddlewares({
  routes: [
    // Each module's generic admin API, at the path its entity set declares.
    ...vehicleRoutes.middlewares(VEHICLES_PATH),
    ...fitmentRoutes.middlewares(FITMENTS_PATH),
    ...partsRoutes.middlewares(PARTS_PATH),
    {
      matcher: `${FITMENTS_PATH}/fitment/:id/conditions`,
      methods: ["PUT"],
      middlewares: [validateAndTransformBody(ReplaceConditionsSchema)],
    },
    // Customer garage: logged-in customers only, scoped to themselves.
    { matcher: "/store/garage*", middlewares: [authenticate("customer", ["session", "bearer"])] },
    { matcher: "/store/garage", methods: ["POST"], middlewares: [validateAndTransformBody(GarageCreateSchema)] },
    { matcher: "/store/garage/:id", methods: ["PUT"], middlewares: [validateAndTransformBody(GarageUpdateSchema)] },
    { matcher: "/store/garage/:id/parts", methods: ["GET"], middlewares: [query(StorePartsParams)] },
    // Public catalog for the storefront (publishable key required by Medusa).
    { matcher: "/store/vehicles", methods: ["GET"], middlewares: [query(StoreSelectorParams)] },
    { matcher: "/store/vehicles/makes", methods: ["GET"], middlewares: [query(StoreSelectorParams)] },
    { matcher: "/store/vehicles/models", methods: ["GET"], middlewares: [query(StoreSelectorParams)] },
    { matcher: "/store/vehicles/generations", methods: ["GET"], middlewares: [query(StoreSelectorParams)] },
    { matcher: "/store/vehicles/:id/parts", methods: ["GET"], middlewares: [query(StoreVehiclePartsParams)] },
    { matcher: "/store/parts/search", methods: ["GET"], middlewares: [query(StorePartSearchParams)] },
  ],
});
