// Every /parts/* URL: the module's routes rendered by the CRUD templates,
// with one sidebar entry per feature under "Parts".
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Module, crudTemplates } from "@repo/dashboard/module";
import { sidebarItems } from "@repo/framework/core";
import { ModuleRouter } from "@repo/framework/admin";
import parts from "../../../modules/parts";

export const config = defineRouteConfig({
  label: parts.name,
  items: sidebarItems(parts),
});

export default function PartsRoutes() {
  return (
    <Module module={parts}>
      <ModuleRouter module={parts} templates={crudTemplates} />
    </Module>
  );
}
