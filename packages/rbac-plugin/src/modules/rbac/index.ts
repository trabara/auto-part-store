import { Module } from "@medusajs/framework/utils";
import { default as RbacV2ModuleService } from "./services/rbac.service";

export const RBAC_V2_MODULE = "rbacV2";

export default Module(RBAC_V2_MODULE, {
  service: RbacV2ModuleService,
});

export type { RbacV2ModuleService };
