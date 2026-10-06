// Every /parts/* URL: the module's routes rendered by the CRUD templates,
// with one sidebar entry per feature under "Parts".
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Module, crudTemplates } from "@repo/dashboard/module";
import { sidebarItems } from "@repo/framework/core";
import { ModuleRouter } from "@repo/framework/admin";
import definition from "../../../../modules/parts/admin/module";

export const config = defineRouteConfig({
  label: definition.name,
  items: sidebarItems(definition),
});

export default function PartsRoutes() {
  return (
    <Module module={definition}>
      <ModuleRouter module={definition} templates={crudTemplates} />
    </Module>
  );
}
