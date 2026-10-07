import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ModuleHome } from "@repo/framework/admin";
import { i18nKeys } from "@repo/framework/core";
import { garageAdmin as definition } from "@repo/module-garage/admin";

// Label: a translation key (module messages); Medusa reads `translationNs` statically.
export const config = defineRouteConfig({ label: i18nKeys.module(definition.path), translationNs: "translation" });
export default function GarageIndex() {
  return <ModuleHome module={definition} />;
}
