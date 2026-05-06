import { model } from "@medusajs/framework/utils";

const OAuthProviderConfig = model.define("oauth_provider_config", {
  id: model.id().primaryKey(),
  provider: model.text(),
  client_id: model.text(),
  client_secret: model.text(),
  callback_url: model.text(),
  success_redirect_url: model.text(),
  enabled: model.boolean().default(false),
});

export default OAuthProviderConfig;
