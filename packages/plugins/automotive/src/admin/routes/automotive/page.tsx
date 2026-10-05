import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ModuleHome } from "@repo/framework/admin";
import automotive from "../../modules/automotive";

export const config = defineRouteConfig({ label: automotive.name });
export default function AutomotiveIndex() {
  return <ModuleHome module={automotive} />;
}
