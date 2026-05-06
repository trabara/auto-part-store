"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const utils_2 = require("@medusajs/utils");
const oauth_1 = require("@repo/domain-modules/oauth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * GET /store/auth/google/callback?code=...&state=...
 *
 * Exchanges the Google authorization code for an access token, finds or
 * creates a customer + auth identity, generates a Medusa JWT, and then
 * redirects the browser back to the storefront.
 */
const GET = async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state) {
        res.status(400).json({ message: "Missing code or state parameter" });
        return;
    }
    const oauthService = req.scope.resolve(oauth_1.OAUTH_MODULE);
    const config = req.scope.resolve(utils_1.ContainerRegistrationKeys.CONFIG_MODULE);
    const authModule = req.scope.resolve(utils_1.Modules.AUTH);
    const customerModule = req.scope.resolve(utils_1.Modules.CUSTOMER);
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
    let statePayload;
    try {
        statePayload = jsonwebtoken_1.default.verify(state, http.jwtSecret);
    }
    catch {
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
    const tokenData = (await tokenResponse.json());
    if (!tokenData.id_token) {
        res.status(502).json({ message: "No id_token in Google response" });
        return;
    }
    // Decode id_token (no verification needed — already validated by Google).
    const idPayload = jsonwebtoken_1.default.decode(tokenData.id_token);
    if (!idPayload?.sub || !idPayload?.email) {
        res.status(502).json({ message: "Invalid id_token payload" });
        return;
    }
    const { sub, email, given_name, family_name } = idPayload;
    // Find or create the auth identity for this Google account.
    const [existingIdentity] = await authModule.listAuthIdentities({ provider_identities: { entity_id: sub, provider: "google" } }, { relations: ["provider_identities"] });
    let authIdentity = existingIdentity;
    let customerId;
    if (authIdentity) {
        customerId = authIdentity.app_metadata?.customer_id;
    }
    else {
        // Find an existing customer with the same email or create one.
        const [existingCustomer] = await customerModule.listCustomers({ email });
        let customer;
        if (existingCustomer) {
            customer = existingCustomer;
        }
        else {
            [customer] = await customerModule.createCustomers([
                {
                    email,
                    first_name: given_name,
                    last_name: family_name,
                },
            ]);
        }
        // Activate the account.
        await customerModule.updateCustomers(customer.id, {
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
    const token = (0, utils_2.generateJwtToken)({
        actor_id: customerId,
        actor_type: "customer",
        auth_identity_id: authIdentity.id,
        app_metadata: { customer_id: customerId },
    }, {
        secret: http.jwtSecret,
        expiresIn: http.jwtExpiresIn ?? "1d",
    });
    // Redirect back to the storefront callback page.
    const redirectUrl = new URL(`/auth/google/callback`, provider.success_redirect_url);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("return_to", returnTo);
    res.redirect(302, redirectUrl.toString());
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2F1dGgvZ29vZ2xlL2NhbGxiYWNrL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUtBLHFEQUErRTtBQUMvRSwyQ0FBbUQ7QUFDbkQsc0RBQXFGO0FBQ3JGLGdFQUErQjtBQUUvQjs7Ozs7O0dBTUc7QUFDSSxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxHQUFHLENBQUMsS0FBMEMsQ0FBQztJQUV2RSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDcEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsaUNBQWlDLEVBQUUsQ0FBQyxDQUFDO1FBQ3JFLE9BQU87SUFDVCxDQUFDO0lBRUQsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQXVCLG9CQUFZLENBQUMsQ0FBQztJQUMzRSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxpQ0FBeUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMxRSxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBcUIsZUFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZFLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUN0QyxlQUFPLENBQUMsUUFBUSxDQUNqQixDQUFDO0lBRUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLE1BQU0sWUFBWSxDQUFDLHdCQUF3QixDQUFDO1FBQzdELFFBQVEsRUFBRSxRQUFRO1FBQ2xCLE9BQU8sRUFBRSxJQUFJO0tB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