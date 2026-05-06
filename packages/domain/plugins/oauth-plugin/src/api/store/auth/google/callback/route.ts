import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type {
  IAuthModuleService,
  ICustomerModuleService,
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { generateJwtToken } from "@medusajs/utils";
import { OAUTH_MODULE, type OAuthProviderService } from "@repo/domain-modules/oauth";
import jwt from "jsonwebtoken";

/**
 * GET /store/auth/google/callback?code=...&state=...
 *
 * Exchanges the Google authorization code for an access token, finds or
 * creates a customer + auth identity, generates a Medusa JWT, and then
 * redirects the browser back to the storefront.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    res.status(400).json({ message: "Missing code or state parameter" });
    return;
  }

  const oauthService = req.scope.resolve<OAuthProviderService>(OAUTH_MODULE);
  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE);
  const authModule = req.scope.resolve<IAuthModuleService>(Modules.AUTH);
  const customerModule = req.scope.resolve<ICustomerModuleService>(
    Modules.CUSTOMER,
  );

  const [provider] = await oauthService.listOAuthProviderConfigs({
    provider: "google",
    enabled: true,
  });

  if (!provider) {
    res
      .status(404)
      .json({ message: "Google OAuth provider not configured or disabled" });
    return;
  }

  // Verify state JWT.
  const { http } = config.projectConfig;
  let statePayload: { return_to: string; nonce: string };
  try {
    statePayload = jwt.verify(state, http.jwtSecret as string) as any;
  } catch {
    res.status(400).json({ message: "Invalid or expired state parameter" });
    return;
  }

  const returnTo = statePayload.return_to?.startsWith("/")
    ? statePayload.return_to
    : "/account";

  // Exchange authorization code for tokens.
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: provider.client_id,
      client_secret: provider.client_secret,
      redirect_uri: provider.callback_url,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    res.status(502).json({ message: "Failed to exchange authorization code" });
    return;
  }

  const tokenData = (await tokenResponse.json()) as { id_token?: string };
  if (!tokenData.id_token) {
    res.status(502).json({ message: "No id_token in Google response" });
    return;
  }

  // Decode id_token (no verification needed — already validated by Google).
  const idPayload = jwt.decode(tokenData.id_token) as {
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
  } | null;

  if (!idPayload?.sub || !idPayload?.email) {
    res.status(502).json({ message: "Invalid id_token payload" });
    return;
  }

  const { sub, email, given_name, family_name } = idPayload;

  // Find or create the auth identity for this Google account.
  const [existingIdentity] = await authModule.listAuthIdentities(
    { provider_identities: { entity_id: sub, provider: "google" } },
    { relations: ["provider_identities"] },
  );

  let authIdentity = existingIdentity;
  let customerId: string;

  if (authIdentity) {
    customerId = (authIdentity.app_metadata as any)?.customer_id;
  } else {
    // Find an existing customer with the same email or create one.
    const [existingCustomer] = await customerModule.listCustomers({ email });

    let customer: any;

    if (existingCustomer) {
      customer = existingCustomer;
    } else {
      [customer] = await customerModule.createCustomers([
        {
          email,
          first_name: given_name,
          last_name: family_name,
        },
      ]);
    }

    // Activate the account.
    await (customerModule as any).updateCustomers(customer.id, {
      has_account: true,
    });

    // Create the auth identity linked to this customer.
    authIdentity = await authModule.createAuthIdentities({
      provider_identities: [
        {
          entity_id: sub,
          provider: "google",
          provider_metadata: { email, given_name, family_name },
        },
      ],
      app_metadata: { customer_id: customer.id },
    });

    customerId = customer.id;
  }

  // Generate the Medusa customer JWT.
  const token = generateJwtToken(
    {
      actor_id: customerId,
      actor_type: "customer",
      auth_identity_id: authIdentity.id,
      app_metadata: { customer_id: customerId },
    },
    {
      secret: http.jwtSecret as string,
      expiresIn: (http as any).jwtExpiresIn ?? "1d",
    },
  );

  // Redirect back to the storefront callback page.
  const redirectUrl = new URL(
    `/auth/google/callback`,
    provider.success_redirect_url,
  );
  redirectUrl.searchParams.set("token", token);
  redirectUrl.searchParams.set("return_to", returnTo);

  res.redirect(302, redirectUrl.toString());
};
