import { Module } from "@medusajs/framework/utils";
import { AUTHZ_MODULE } from "./constant";
import AuthzModuleService from "./services/authz-module.service";

export { AUTHZ_MODULE };

export default Module(AUTHZ_MODULE, {
  service: AuthzModuleService,
});

export type { AuthzModuleService };

  export * from "./middleware";

