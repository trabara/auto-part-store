// The automotive domain: what an application registers to run it (this
// plugin plus the modules it builds on). See `composeApplication`.
import { defineDomainManifest } from "@repo/framework/core";
import { fitmentManifest } from "@repo/module-fitment/manifest";
import { partsManifest } from "@repo/module-parts/manifest";
import { vehicleManifest } from "@repo/module-vehicle/manifest";

export const automotiveDomain = defineDomainManifest({
  name: "automotive",
  resolve: "@repo/domain-automotive",
  modules: [vehicleManifest, fitmentManifest, partsManifest],
});
