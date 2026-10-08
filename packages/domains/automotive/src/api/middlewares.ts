import { defineMiddlewares } from "@medusajs/framework";
import { authenticate, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework/http";
import { ReplaceConditionsSchema } from "@repo/module-fitment/contract";
import { FITMENTS_PATH, fitmentRoutes } from "@repo/module-fitment";
import { GARAGE_PATH, garageRoutes } from "@repo/module-garage";
import { PARTS_PATH, partsRoutes } from "@repo/module-parts";
import { VEHICLES_PATH, vehicleRoutes } from "@repo/module-vehicle";
import { CatalogFileSchema } from "@repo/module-vehicle/contract";
import {
  AdminCatalogCoverageParams,
  AdminCatalogExportParams,
  AdminCatalogImportParams,
  AdminCatalogTasksParams,
  AdminResearchReadBody,
  AdminResearchSearchBody,
  AdminResearchValidateBody,
  AdminResearchWikiSearchBody,
  AdminStewardClaimBody,
  AdminStewardLeaseBody,
  AdminStewardRefreshBody,
  AdminStewardRejectBody,
  AdminStewardResultBody,
} from "./admin/validators";
import {
  GarageCreateSchema,
  GarageUpdateSchema,
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
    ...garageRoutes.middlewares(GARAGE_PATH),
    {
      matcher: `${FITMENTS_PATH}/fitment/:id/conditions`,
      methods: ["PUT"],
      middlewares: [validateAndTransformBody(ReplaceConditionsSchema)],
    },
    // The catalog steward: rules, the task ledger (refresh, claim, prompt,
    // result, review) and the research gateway its agent reads the web through.
    { matcher: "/admin/vehicle-catalog/tasks/refresh", methods: ["POST"], middlewares: [validateAndTransformBody(AdminStewardRefreshBody)] },
    { matcher: "/admin/vehicle-catalog/tasks/claim", methods: ["POST"], middlewares: [validateAndTransformBody(AdminStewardClaimBody)] },
    { matcher: "/admin/vehicle-catalog/tasks/:id/prompt", methods: ["POST"], middlewares: [validateAndTransformBody(AdminStewardLeaseBody)] },
    {
      matcher: "/admin/vehicle-catalog/tasks/:id/result",
      methods: ["POST"],
      bodyParser: { sizeLimit: "5mb" },
      middlewares: [validateAndTransformBody(AdminStewardResultBody)],
    },
    { matcher: "/admin/vehicle-catalog/tasks/:id/reject", methods: ["POST"], middlewares: [validateAndTransformBody(AdminStewardRejectBody)] },
    { matcher: "/admin/vehicle-catalog/research/search", methods: ["POST"], middlewares: [validateAndTransformBody(AdminResearchSearchBody)] },
    { matcher: "/admin/vehicle-catalog/research/wiki-search", methods: ["POST"], middlewares: [validateAndTransformBody(AdminResearchWikiSearchBody)] },
    { matcher: "/admin/vehicle-catalog/research/read", methods: ["POST"], middlewares: [validateAndTransformBody(AdminResearchReadBody)] },
    { matcher: "/admin/vehicle-catalog/research/validate", methods: ["POST"], middlewares: [validateAndTransformBody(AdminResearchValidateBody)] },
    // Vehicle catalog research: tasks and coverage (what to research), export
    // (what exists), import (validate with ?dry_run=true, then apply). A
    // model's catalog can be large, hence the body size.
    { matcher: "/admin/vehicle-catalog/tasks", methods: ["GET"], middlewares: [query(AdminCatalogTasksParams)] },
    { matcher: "/admin/vehicle-catalog/coverage", methods: ["GET"], middlewares: [query(AdminCatalogCoverageParams)] },
    { matcher: "/admin/vehicle-catalog/export", methods: ["GET"], middlewares: [query(AdminCatalogExportParams)] },
    {
      matcher: "/admin/vehicle-catalog/import",
      methods: ["POST"],
      bodyParser: { sizeLimit: "10mb" },
      middlewares: [query(AdminCatalogImportParams), validateAndTransformBody(CatalogFileSchema)],
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
