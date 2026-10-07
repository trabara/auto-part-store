// The automotive domain: what an application registers to run it (this
// plugin plus the modules it builds on). See `composeApplication`.
import { defineDomainManifest } from "@repo/framework/core";
import { garageManifest } from "@repo/module-garage/contract";
import { fitmentManifest } from "@repo/module-fitment/contract";
import { partsManifest } from "@repo/module-parts/contract";
import { vehicleManifest } from "@repo/module-vehicle/contract";

export const automotiveDomain = defineDomainManifest({
  name: "automotive",
  resolve: "@repo/domain-automotive",
  modules: [vehicleManifest, fitmentManifest, partsManifest, garageManifest],
});
