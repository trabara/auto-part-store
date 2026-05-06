import OAuthProviderService from "./service";
import { Module } from "@medusajs/framework/utils";
import { OAUTH_MODULE } from "./constant";
import setupOAuthPermissionsLoader from "./loaders/setup-permissions";

export { OAUTH_MODULE };
export { default as OAuthProviderService } from "./service";

export default Module(OAUTH_MODULE, {
  service: OAuthProviderService,
  // loaders: [setupOAuthPermissionsLoader],
});
