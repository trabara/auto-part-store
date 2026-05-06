import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { OAUTH_MODULE, type OAuthProviderService } from "@repo/domain-modules/oauth";
import jwt from "jsonwebtoken";

/**
 * GET /store/auth/google?return_to=/checkout
 *
 * Returns the Google OAuth authorization URL. The client should redirect
 * the browser to that URL.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<OAuthProviderService>(OAUTH_MODULE);
  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE);

  const [provider] = await service.listOAuthProviderConfigs({
    provider: "google",
    enabled: true,
  });

  if (!provider) {
    res
      .status(404)
      .json({ message: "Google OAuth provider not configured or disabled" });
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
    client_id: provider.client_id,
    redirect_uri: provider.callback_url,
    response_type: "code",
    scope: "openid email profile",
    state,
  });

  const location = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  res.json({ location });
};
