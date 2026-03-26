import { Module } from "@medusajs/framework/utils";
import createRbacLoader from "./loaders/seed-rbac";
import RbacModuleService from "./services/rbac.service";

export const RBAC_MODULE = "roleBasedAccessControl";

export default Module(RBAC_MODULE, {
  service: RbacModuleService,
  loaders: [createRbacLoader]
});

export type { RbacModuleService };
