// Every /vehicles/* URL: the module's routes rendered by the CRUD templates,
// with one sidebar entry per feature under "Vehicles".
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Module, crudTemplates } from "@repo/dashboard/module";
import { translatedMenu } from "@repo/framework/core";
import { ModuleRouter } from "@repo/framework/admin";
import definition from "../../../../modules/vehicle/admin/module";

// Labels are translation keys (module messages); Medusa reads `label` and
// `translationNs` statically, so they are spelled out here.
const menu = translatedMenu(definition);
export const config = defineRouteConfig({ label: menu.label, translationNs: "translation", items: menu.items });

export default function VehiclesRoutes() {
  return (
    <Module module={definition}>
      <ModuleRouter module={definition} templates={crudTemplates} />
    </Module>
  );
}
