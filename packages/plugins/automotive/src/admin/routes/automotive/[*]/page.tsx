// Every /automotive/* URL: the module's routes rendered by the CRUD templates.
// `items` puts one sidebar entry per feature under "Automotive"
// (expanded by medusaRouterExt; the splat itself never shows in the sidebar).
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Module, crudTemplates } from "@repo/dashboard/module";
import { sidebarItems } from "@repo/framework/core";
import { ModuleRouter } from "@repo/framework/admin";
import { sdk } from "../../../lib/sdk";
import automotive from "../../../modules/automotive";

export const config = defineRouteConfig({
  label: automotive.name,
  items: sidebarItems(automotive),
});

export default function AutomotiveRoutes() {
  return (
    <Module sdk={sdk} module={automotive}>
      <ModuleRouter module={automotive} templates={crudTemplates} />
    </Module>
  );
}
