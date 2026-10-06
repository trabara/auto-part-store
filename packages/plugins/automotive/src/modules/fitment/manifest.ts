import { defineModuleManifest } from "@repo/framework/core";

// Read by the layer check (packages/config/eslint/module-boundaries.js):
// keep `key` and `dependsOn` literal. This module may import only its
// dependencies' `entities` entry.
export const fitmentManifest = defineModuleManifest({ key: "fitment", dependsOn: ["vehicle"] });
