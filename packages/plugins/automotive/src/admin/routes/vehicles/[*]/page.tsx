// Every /vehicles/* URL: the module's routes rendered by the CRUD templates,
// with one sidebar entry per feature under "Vehicles".
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Module, crudTemplates } from "@repo/dashboard/module";
import { sidebarItems } from "@repo/framework/core";
import { ModuleRouter } from "@repo/framework/admin";
import definition from "../../../../modules/vehicle/admin/module";

export const config = defineRouteConfig({
  label: definition.name,
  items: sidebarItems(definition),
});

export default function VehiclesRoutes() {
  return (
    <Module module={definition}>
      <ModuleRouter module={definition} templates={crudTemplates} />
    </Module>
  );
}
