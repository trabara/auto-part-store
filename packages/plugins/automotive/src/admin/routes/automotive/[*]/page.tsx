// Every /automotive/* URL: the module's routes rendered by the CRUD templates.
import { Module, ModuleNav, crudTemplates } from "@repo/dashboard/module";
import { ModuleRouter } from "@repo/framework/admin";
import { sdk } from "../../../lib/sdk";
import automotive from "../../../modules/automotive";

export default function AutomotiveRoutes() {
  return (
    <Module sdk={sdk} module={automotive}>
      <ModuleNav />
      <ModuleRouter module={automotive} templates={crudTemplates} />
    </Module>
  );
}
