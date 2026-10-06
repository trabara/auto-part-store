import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ModuleHome } from "@repo/framework/admin";
import parts from "../../modules/parts";

export const config = defineRouteConfig({ label: parts.name });
export default function PartsIndex() {
  return <ModuleHome module={parts} />;
}
