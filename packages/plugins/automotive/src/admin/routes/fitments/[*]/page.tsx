// Every /fitments/* URL: the module's routes rendered by the CRUD templates,
// with one sidebar entry per feature under "Fitments".
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Module, crudTemplates } from "@repo/dashboard/module";
import { sidebarItems } from "@repo/framework/core";
import { ModuleRouter } from "@repo/framework/admin";
import definition from "../../../../modules/fitment/admin/module";
import { fitmentSections } from "../../../../modules/fitment/admin/sections";

export const config = defineRouteConfig({
  label: definition.name,
  items: sidebarItems(definition),
});

export default function FitmentsRoutes() {
  return (
    <Module module={definition} sections={fitmentSections}>
      <ModuleRouter module={definition} templates={crudTemplates} />
    </Module>
  );
}
