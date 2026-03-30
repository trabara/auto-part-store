import { Module } from "@medusajs/framework/utils";
import createRbacLoader from "./loaders/create-rbac";
import RbacModuleService from "./services/rbac.service";

export const RBAC_MODULE = "roleBaseAccessControl";

export default Module(RBAC_MODULE, {
  service: RbacModuleService,
  loaders: [createRbacLoader]
});

export type { RbacModuleService };
