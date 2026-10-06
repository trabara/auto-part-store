import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ModuleHome } from "@repo/framework/admin";
import definition from "../../../modules/fitment/admin/module";

export const config = defineRouteConfig({ label: definition.name });
export default function FitmentsIndex() {
  return <ModuleHome module={definition} />;
}
