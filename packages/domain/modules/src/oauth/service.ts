import { MedusaService } from "@medusajs/framework/utils";
import OAuthProviderConfig from "./models/oauth-provider-config";

class OAuthProviderService extends MedusaService({
  OAuthProviderConfig,
}) {}

export default OAuthProviderService;
