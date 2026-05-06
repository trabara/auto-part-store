import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { OAUTH_MODULE, type OAuthProviderService } from "@repo/domain-modules/oauth";
import jwt from "jsonwebtoken";

const PROVIDER_URLS: Record<string, string> = {
  google: "https://accounts.google.com/o/oauth2/v2/auth",
  facebook: "https://www.facebook.com/v10.0/dialog/oauth",
  apple: "https://appleid.apple.com/auth/authorize",
}

/**
 * GET /store/auth/google?return_to=/checkout
 *
 * Returns the Google OAuth authorization URL. The client should redirect
 * the browser to that URL.
 */
export const GET = async (req: MedusaRequest<{ provider: string }>, res: MedusaResponse) => {
  const { provider } = req.params
  const service = req.scope.resolve<OAuthProviderService>(OAUTH_MODULE);
  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE);

  const [providerConfig] = await service.listOAuthProviderConfigs({
    provider: provider,
    enabled: true,
  });

  if (!providerConfig) {
    res
      .status(404)
      .json({ message: `${provider} OAuth provider not configured or disabled` });
    return;
  }

  const returnTo = (req.query.return_to as string) || "/account";
  const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/account";

  // Build a short-lived state JWT to carry return_to and a nonce.
  const { http } = config.projectConfig;
  const state = jwt.sign(
    { return_to: safeReturnTo, nonce: Math.random().toString(36).slice(2) },
    http.jwtSecret as string,
    { expiresIn: "10m" },
  );

  const params = new URLSearchParams({
    client_id: providerConfig.client_id,
    redirect_uri: providerConfig.callback_url,
    response_type: "code",
    scope: "openid email profile",
    state,
  });

  const location = `${PROVIDER_URLS[provider]}?${params.toString()}`;

  res.json({ location });
};
