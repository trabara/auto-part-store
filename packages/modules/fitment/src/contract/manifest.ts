import { defineModuleManifest } from "@repo/framework/core";

/** Container key of the fitment module (fitments, positions, conditions). */
export const FITMENT_MODULE = "fitment";

// Read by the layer check (packages/config/eslint/module-boundaries.js): keep
// `key` and `dependsOn` literal. This module may import only its
// dependencies' contract (`@repo/module-vehicle/contract`).
export const fitmentManifest = defineModuleManifest({ key: "fitment", dependsOn: ["vehicle"], resolve: "@repo/module-fitment" });
