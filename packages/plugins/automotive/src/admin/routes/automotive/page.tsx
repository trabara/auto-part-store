import { defineRouteConfig } from "@medusajs/admin-sdk";
import moduleDef from "../../modules/automotive";

export const config = defineRouteConfig(moduleDef.getRouter());
