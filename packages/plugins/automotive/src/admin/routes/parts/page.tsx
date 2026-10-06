import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ModuleHome } from "@repo/framework/admin";
import definition from "../../../modules/parts/admin/module";

export const config = defineRouteConfig({ label: definition.name });
export default function PartsIndex() {
  return <ModuleHome module={definition} />;
}
