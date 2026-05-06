import { Module } from "@medusajs/framework/utils";
import { AUTHZ_MODULE } from "./constant";
import AuthzModuleService from "./services/authz-module.service";
import setupRbacLoader from "./loaders/setup-rbac";

export { AUTHZ_MODULE };

export default Module(AUTHZ_MODULE, {
  service: AuthzModuleService,
  // loaders: [setupRbacLoader],
});

export type { AuthzModuleService };

export * from "./middleware";
