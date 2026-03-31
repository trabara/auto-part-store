import { Module } from "@medusajs/framework/utils";
import createDefaultPolicies from "./loaders/create-default-policies";
import AuthzModuleService from "./services/authz.service";

export const AUTHZ_MODULE = "authz";

export default Module(AUTHZ_MODULE, {
  service: AuthzModuleService,
  loaders: [createDefaultPolicies],
});

export type { AuthzModuleService };

export * from "./middleware";
export * from "./schema";

