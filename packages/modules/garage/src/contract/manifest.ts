import { defineModuleManifest } from "@repo/framework/core";

/** Container key of the garage module. */
export const GARAGE_MODULE = "garage";

// Read by the layer check (packages/config/eslint/module-boundaries.js): keep
// `key` and `dependsOn` literal. Other modules may import only this module's
// contract (`@repo/module-garage/contract`).
export const garageManifest = defineModuleManifest({
  key: "garage",
  dependsOn: ["vehicle"],
  resolve: "@repo/module-garage",
});
