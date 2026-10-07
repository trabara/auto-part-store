import { defineModuleManifest } from "@repo/framework/core";

/** Container key of the vehicle module (makes, models, engines, vehicles). */
export const VEHICLE_MODULE = "vehicle";

// Read by the layer check (packages/config/eslint/module-boundaries.js): keep
// `key` and `dependsOn` literal. Other modules may import only this module's
// contract (`@repo/module-vehicle/contract`).
export const vehicleManifest = defineModuleManifest({ key: "vehicle", dependsOn: [], resolve: "@repo/module-vehicle" });
