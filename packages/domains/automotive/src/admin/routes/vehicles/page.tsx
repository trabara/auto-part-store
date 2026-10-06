import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ModuleHome } from "@repo/framework/admin";
import { i18nKeys } from "@repo/framework/core";
import { vehicleAdmin as definition } from "@repo/module-vehicle/admin";

// Label: a translation key (module messages); Medusa reads `translationNs` statically.
export const config = defineRouteConfig({ label: i18nKeys.module(definition.path), translationNs: "translation" });
export default function VehiclesIndex() {
  return <ModuleHome module={definition} />;
}
