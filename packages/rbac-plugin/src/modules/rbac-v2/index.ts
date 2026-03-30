import { Module } from "@medusajs/framework/utils";
import { default as RbacV2ModuleService } from "./services/rbac-v2.service";

export const RBAC_V2_MODULE = "rbac_v2";

export default Module(RBAC_V2_MODULE, {
  service: RbacV2ModuleService,
});

export type { RbacV2ModuleService };
