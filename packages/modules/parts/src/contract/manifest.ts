import { defineModuleManifest } from "@repo/framework/core";

/** Container key of the parts module (brands, part numbers). */
export const PARTS_MODULE = "parts";

// Read by the layer check (packages/config/eslint/module-boundaries.js): keep
// `key` and `dependsOn` literal. Other modules may import only this module's
// contract (`@repo/module-parts/contract`).
export const partsManifest = defineModuleManifest({ key: "parts", dependsOn: [], resolve: "@repo/module-parts" });
