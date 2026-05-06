import OAuthProviderService from "./service";
import { Module } from "@medusajs/framework/utils";
import { OAUTH_MODULE } from "./constant";

export { OAUTH_MODULE };
export { default as OAuthProviderService } from "./service";

export default Module(OAUTH_MODULE, {
  service: OAuthProviderService,
});
