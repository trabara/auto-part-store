import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ModuleHome } from "@repo/framework/admin";
import definition from "../../../modules/vehicle/admin/module";

export const config = defineRouteConfig({ label: definition.name });
export default function VehiclesIndex() {
  return <ModuleHome module={definition} />;
}
