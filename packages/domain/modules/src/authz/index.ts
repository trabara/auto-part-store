import { Module } from "@medusajs/framework/utils";
import AuthzModuleService from "./services/authz.service";
import { AUTHZ_MODULE } from "./constant";
import * as Models from "./models";

export { AUTHZ_MODULE };

// Register DML models on the service so Module() can build linkable keys
const _modelObjectsSymbol = Symbol.for("MedusaServiceModelObjectsSymbol");
(AuthzModuleService as any)[_modelObjectsSymbol] = {
  AuthzRole: Models.AuthzRole,
  AuthzPermission: Models.AuthzPermission,
  AuthzPolicy: Models.AuthzPolicy,
  AuthzMember: Models.AuthzMember,
  AuthzCategory: Models.AuthzCategory,
};

export default Module(AUTHZ_MODULE, {
  service: AuthzModuleService,
});

export type { AuthzModuleService };

export * from "./middleware";
