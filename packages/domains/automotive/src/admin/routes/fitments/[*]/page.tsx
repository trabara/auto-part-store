// Every /fitments/* URL: the module's routes rendered by the CRUD templates,
// with one sidebar entry per feature under "Fitments".
import "../../../setup";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Module, crudTemplates } from "@repo/dashboard/module";
import { translatedMenu } from "@repo/framework/core";
import { ModuleRouter } from "@repo/framework/admin";
import { fitmentAdmin as definition } from "@repo/module-fitment/admin";
import { fitmentSections } from "@repo/module-fitment/admin/ui";

// Labels are translation keys (module messages); Medusa reads `label` and
// `translationNs` statically, so they are spelled out here.
const menu = translatedMenu(definition);
export const config = defineRouteConfig({ label: menu.label, translationNs: "translation", items: menu.items });

export default function FitmentsRoutes() {
  return (
    <Module module={definition} sections={fitmentSections}>
      <ModuleRouter module={definition} templates={crudTemplates} />
    </Module>
  );
}
