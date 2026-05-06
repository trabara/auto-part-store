"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "GET", {
    enumerable: true,
    get: function() {
        return GET;
    }
});
const _utils = require("@medusajs/framework/utils");
const _utils1 = require("@medusajs/utils");
const _oauth = require("@repo/domain-modules/oauth");
const _jsonwebtoken = /*#__PURE__*/ _interop_require_default(require("jsonwebtoken"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const PROVIDER_EXCHANGE_URLS = {
    google: "https://oauth2.googleapis.com/token"
};
const GET = async (req, res)=>{
    const { provider } = req.params;
    const { code, state } = req.query;
    console.log("OAuth callback received", {
        provider,
        code,
        state
    });
    if (!code || !state) {
        res.status(400).json({
            message: "Missing code or state parameter"
        });
        return;
    }
    const oauthService = req.scope.resolve(_oauth.OAUTH_MODULE);
    const config = req.scope.resolve(_utils.ContainerRegistrationKeys.CONFIG_MODULE);
    const authModule = req.scope.resolve(_utils.Modules.AUTH);
    const customerModule = req.scope.resolve(_utils.Modules.CUSTOMER);
    const [providerConfig] = await oauthService.listOAuthProviderConfigs({
        provider,
        enabled: true
    });
    if (!providerConfig) {
        res.status(404).json({
            message: `${provider} OAuth provider not configured or disabled`
        });
        return;
    }
    // Verify state JWT.
    const { http } = config.projectConfig;
    let statePayload;
    try {
        statePayload = _jsonwebtoken.default.verify(state.toString(), http.jwtSecret);
    } catch  {
        res.status(400).json({
            message: "Invalid or expired state parameter"
        });
        return;
    }
    const returnTo = statePayload.return_to?.startsWith("/") ? statePayload.return_to : "/account";
    const exchangeUrl = PROVIDER_EXCHANGE_URLS[provider];
    if (!exchangeUrl) {
        res.status(400).json({
            message: "Unsupported provider"
        });
        return;
    }
    // Exchange authorization code for tokens.
    const tokenResponse = await fetch(exchangeUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            code: code.toString(),
            client_id: providerConfig.client_id,
            client_secret: providerConfig.client_secret,
            redirect_uri: providerConfig.callback_url,
            grant_type: "authorization_code"
        })
    });
    if (!tokenResponse.ok) {
        res.status(502).json({
            message: "Failed to exchange authorization code"
        });
        return;
    }
    const tokenData = await tokenResponse.json();
    if (!tokenData.id_token) {
        res.status(502).json({
            message: `No id_token in ${provider} response`
        });
        return;
    }
    // Decode id_token (no verification needed — already validated by the provider).
    const idPayload = _jsonwebtoken.default.decode(tokenData.id_token);
    if (!idPayload?.sub || !idPayload?.email) {
        res.status(502).json({
            message: "Invalid id_token payload"
        });
        return;
    }
    const { sub, email, given_name, family_name } = idPayload;
    // Find or create the auth identity for this OAuth provider account.
    const [existingIdentity] = await authModule.listAuthIdentities({
        provider_identities: {
            entity_id: sub,
            provider
        }
    }, {
        relations: [
            "provider_identities"
        ]
    });
    let authIdentity = existingIdentity;
    let customerId;
    if (authIdentity) {
        customerId = authIdentity.app_metadata?.customer_id;
    } else {
        // Find an existing customer with the same email or create one.
        const [existingCustomer] = await customerModule.listCustomers({
            email
        });
        let customer;
        if (existingCustomer) {
            customer = existingCustomer;
        } else {
            [customer] = await customerModule.createCustomers([
                {
                    email,
                    first_name: given_name,
                    last_name: family_name
                }
            ]);
        }
        // Activate the account.
        await customerModule.updateCustomers(customer.id, {
            has_account: true
        });
        // Create the auth identity linked to this customer.
        authIdentity = await authModule.createAuthIdentities({
            provider_identities: [
                {
                    entity_id: sub,
                    provider,
                    provider_metadata: {
                        email,
                        given_name,
                        family_name
                    }
                }
            ],
            app_metadata: {
                customer_id: customer.id
            }
        });
        customerId = customer.id;
    }
    // Generate the Medusa customer JWT.
    const token = (0, _utils1.generateJwtToken)({
        actor_id: customerId,
        actor_type: "customer",
        auth_identity_id: authIdentity.id,
        app_metadata: {
            customer_id: customerId
        }
    }, {
        secret: http.jwtSecret,
        expiresIn: http.jwtExpiresIn ?? "1d"
    });
    // Redirect back to the storefront callback page.
    const redirectUrl = new URL(`/auth/${provider}/callback`, providerConfig.success_redirect_url);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("return_to", returnTo);
    res.redirect(302, redirectUrl.toString());
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcGkvc3RvcmUvb2F1dGgvW3Byb3ZpZGVyXS9jYWxsYmFjay9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNZWR1c2FSZXF1ZXN0LCBNZWR1c2FSZXNwb25zZSB9IGZyb20gXCJAbWVkdXNhanMvZnJhbWV3b3JrL2h0dHBcIjtcbmltcG9ydCB0eXBlIHtcbiAgSUF1dGhNb2R1bGVTZXJ2aWNlLFxuICBJQ3VzdG9tZXJNb2R1bGVTZXJ2aWNlLFxufSBmcm9tIFwiQG1lZHVzYWpzL2ZyYW1ld29yay90eXBlc1wiO1xuaW1wb3J0IHsgQ29udGFpbmVyUmVnaXN0cmF0aW9uS2V5cywgTW9kdWxlcyB9IGZyb20gXCJAbWVkdXNhanMvZnJhbWV3b3JrL3V0aWxzXCI7XG5pbXBvcnQgeyBnZW5lcmF0ZUp3dFRva2VuIH0gZnJvbSBcIkBtZWR1c2Fqcy91dGlsc1wiO1xuaW1wb3J0IHsgT0FVVEhfTU9EVUxFLCB0eXBlIE9BdXRoUHJvdmlkZXJTZXJ2aWNlIH0gZnJvbSBcIkByZXBvL2RvbWFpbi1tb2R1bGVzL29hdXRoXCI7XG5pbXBvcnQgand0IGZyb20gXCJqc29ud2VidG9rZW5cIjtcblxuY29uc3QgUFJPVklERVJfRVhDSEFOR0VfVVJMUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgZ29vZ2xlOiBcImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuXCIsXG59O1xuXG4vKipcbiAqIEdFVCAvc3RvcmUvYXV0aC86cHJvdmlkZXIvY2FsbGJhY2s/Y29kZT0uLi4mc3RhdGU9Li4uXG4gKlxuICogRXhjaGFuZ2VzIHRoZSBPQXV0aCBwcm92aWRlciBhdXRob3JpemF0aW9uIGNvZGUgZm9yIGFuIGFjY2VzcyB0b2tlbiwgZmluZHMgb3JcbiAqIGNyZWF0ZXMgYSBjdXN0b21lciArIGF1dGggaWRlbnRpdHksIGdlbmVyYXRlcyBhIE1lZHVzYSBKV1QsIGFuZCB0aGVuXG4gKiByZWRpcmVjdHMgdGhlIGJyb3dzZXIgYmFjayB0byB0aGUgc3RvcmVmcm9udC5cbiAqL1xuZXhwb3J0IGNvbnN0IEdFVCA9IGFzeW5jIChyZXE6IE1lZHVzYVJlcXVlc3Q8eyBwcm92aWRlcjogc3RyaW5nIH0sIHsgY29kZT86IHN0cmluZywgc3RhdGU/OiBzdHJpbmcgfT4sIHJlczogTWVkdXNhUmVzcG9uc2UpID0+IHtcbiAgY29uc3QgeyBwcm92aWRlciB9ID0gcmVxLnBhcmFtc1xuICBjb25zdCB7IGNvZGUsIHN0YXRlIH0gPSByZXEucXVlcnlcbiAgY29uc29sZS5sb2coXCJPQXV0aCBjYWxsYmFjayByZWNlaXZlZFwiLCB7IHByb3ZpZGVyLCBjb2RlLCBzdGF0ZSB9KVxuICBpZiAoIWNvZGUgfHwgIXN0YXRlKSB7XG4gICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBtZXNzYWdlOiBcIk1pc3NpbmcgY29kZSBvciBzdGF0ZSBwYXJhbWV0ZXJcIiB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBvYXV0aFNlcnZpY2UgPSByZXEuc2NvcGUucmVzb2x2ZTxPQXV0aFByb3ZpZGVyU2VydmljZT4oT0FVVEhfTU9EVUxFKTtcbiAgY29uc3QgY29uZmlnID0gcmVxLnNjb3BlLnJlc29sdmUoQ29udGFpbmVyUmVnaXN0cmF0aW9uS2V5cy5DT05GSUdfTU9EVUxFKTtcbiAgY29uc3QgYXV0aE1vZHVsZSA9IHJlcS5zY29wZS5yZXNvbHZlPElBdXRoTW9kdWxlU2VydmljZT4oTW9kdWxlcy5BVVRIKTtcbiAgY29uc3QgY3VzdG9tZXJNb2R1bGUgPSByZXEuc2NvcGUucmVzb2x2ZTxJQ3VzdG9tZXJNb2R1bGVTZXJ2aWNlPihcbiAgICBNb2R1bGVzLkNVU1RPTUVSLFxuICApO1xuXG4gIGNvbnN0IFtwcm92aWRlckNvbmZpZ10gPSBhd2FpdCBvYXV0aFNlcnZpY2UubGlzdE9BdXRoUHJvdmlkZXJDb25maWdzKHtcbiAgICBwcm92aWRlcixcbiAgICBlbmFibGVkOiB0cnVlLFxuICB9KTtcblxuICBpZiAoIXByb3ZpZGVyQ29uZmlnKSB7XG4gICAgcmVzXG4gICAgICAuc3RhdHVzKDQwNClcbiAgICAgIC5qc29uKHsgbWVzc2FnZTogYCR7cHJvdmlkZXJ9IE9BdXRoIHByb3ZpZGVyIG5vdCBjb25maWd1cmVkIG9yIGRpc2FibGVkYCB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBWZXJpZnkgc3RhdGUgSldULlxuICBjb25zdCB7IGh0dHAgfSA9IGNvbmZpZy5wcm9qZWN0Q29uZmlnO1xuICBsZXQgc3RhdGVQYXlsb2FkOiB7IHJldHVybl90bzogc3RyaW5nOyBub25jZTogc3RyaW5nIH07XG4gIHRyeSB7XG4gICAgc3RhdGVQYXlsb2FkID0gand0LnZlcmlmeShzdGF0ZS50b1N0cmluZygpLCBodHRwLmp3dFNlY3JldCBhcyBzdHJpbmcpIGFzIGFueTtcbiAgfSBjYXRjaCB7XG4gICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBtZXNzYWdlOiBcIkludmFsaWQgb3IgZXhwaXJlZCBzdGF0ZSBwYXJhbWV0ZXJcIiB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCByZXR1cm5UbyA9IHN0YXRlUGF5bG9hZC5yZXR1cm5fdG8/LnN0YXJ0c1dpdGgoXCIvXCIpXG4gICAgPyBzdGF0ZVBheWxvYWQucmV0dXJuX3RvXG4gICAgOiBcIi9hY2NvdW50XCI7XG5cbiAgY29uc3QgZXhjaGFuZ2VVcmwgPSBQUk9WSURFUl9FWENIQU5HRV9VUkxTW3Byb3ZpZGVyXVxuICBpZiAoIWV4Y2hhbmdlVXJsKSB7XG4gICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBtZXNzYWdlOiBcIlVuc3VwcG9ydGVkIHByb3ZpZGVyXCIgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRXhjaGFuZ2UgYXV0aG9yaXphdGlvbiBjb2RlIGZvciB0b2tlbnMuXG4gIGNvbnN0IHRva2VuUmVzcG9uc2UgPSBhd2FpdCBmZXRjaChleGNoYW5nZVVybCwge1xuICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiIH0sXG4gICAgYm9keTogbmV3IFVSTFNlYXJjaFBhcmFtcyh7XG4gICAgICBjb2RlOiBjb2RlLnRvU3RyaW5nKCksXG4gICAgICBjbGllbnRfaWQ6IHByb3ZpZGVyQ29uZmlnLmNsaWVudF9pZCxcbiAgICAgIGNsaWVudF9zZWNyZXQ6IHByb3ZpZGVyQ29uZmlnLmNsaWVudF9zZWNyZXQsXG4gICAgICByZWRpcmVjdF91cmk6IHByb3ZpZGVyQ29uZmlnLmNhbGxiYWNrX3VybCxcbiAgICAgIGdyYW50X3R5cGU6IFwiYXV0aG9yaXphdGlvbl9jb2RlXCIsXG4gICAgfSksXG4gIH0pO1xuXG4gIGlmICghdG9rZW5SZXNwb25zZS5vaykge1xuICAgIHJlcy5zdGF0dXMoNTAyKS5qc29uKHsgbWVzc2FnZTogXCJGYWlsZWQgdG8gZXhjaGFuZ2UgYXV0aG9yaXphdGlvbiBjb2RlXCIgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgdG9rZW5EYXRhID0gKGF3YWl0IHRva2VuUmVzcG9uc2UuanNvbigpKSBhcyB7IGlkX3Rva2VuPzogc3RyaW5nIH07XG4gIGlmICghdG9rZW5EYXRhLmlkX3Rva2VuKSB7XG4gICAgcmVzLnN0YXR1cyg1MDIpLmpzb24oeyBtZXNzYWdlOiBgTm8gaWRfdG9rZW4gaW4gJHtwcm92aWRlcn0gcmVzcG9uc2VgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIERlY29kZSBpZF90b2tlbiAobm8gdmVyaWZpY2F0aW9uIG5lZWRlZCDigJQgYWxyZWFkeSB2YWxpZGF0ZWQgYnkgdGhlIHByb3ZpZGVyKS5cbiAgY29uc3QgaWRQYXlsb2FkID0gand0LmRlY29kZSh0b2tlbkRhdGEuaWRfdG9rZW4pIGFzIHtcbiAgICBzdWI6IHN0cmluZztcbiAgICBlbWFpbDogc3RyaW5nO1xuICAgIGdpdmVuX25hbWU/OiBzdHJpbmc7XG4gICAgZmFtaWx5X25hbWU/OiBzdHJpbmc7XG4gIH0gfCBudWxsO1xuXG4gIGlmICghaWRQYXlsb2FkPy5zdWIgfHwgIWlkUGF5bG9hZD8uZW1haWwpIHtcbiAgICByZXMuc3RhdHVzKDUwMikuanNvbih7IG1lc3NhZ2U6IFwiSW52YWxpZCBpZF90b2tlbiBwYXlsb2FkXCIgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgeyBzdWIsIGVtYWlsLCBnaXZlbl9uYW1lLCBmYW1pbHlfbmFtZSB9ID0gaWRQYXlsb2FkO1xuXG4gIC8vIEZpbmQgb3IgY3JlYXRlIHRoZSBhdXRoIGlkZW50aXR5IGZvciB0aGlzIE9BdXRoIHByb3ZpZGVyIGFjY291bnQuXG4gIGNvbnN0IFtleGlzdGluZ0lkZW50aXR5XSA9IGF3YWl0IGF1dGhNb2R1bGUubGlzdEF1dGhJZGVudGl0aWVzKFxuICAgIHsgcHJvdmlkZXJfaWRlbnRpdGllczogeyBlbnRpdHlfaWQ6IHN1YiwgcHJvdmlkZXIgfSB9LFxuICAgIHsgcmVsYXRpb25zOiBbXCJwcm92aWRlcl9pZGVudGl0aWVzXCJdIH0sXG4gICk7XG5cbiAgbGV0IGF1dGhJZGVudGl0eSA9IGV4aXN0aW5nSWRlbnRpdHk7XG4gIGxldCBjdXN0b21lcklkOiBzdHJpbmc7XG5cbiAgaWYgKGF1dGhJZGVudGl0eSkge1xuICAgIGN1c3RvbWVySWQgPSAoYXV0aElkZW50aXR5LmFwcF9tZXRhZGF0YSBhcyBhbnkpPy5jdXN0b21lcl9pZDtcbiAgfSBlbHNlIHtcbiAgICAvLyBGaW5kIGFuIGV4aXN0aW5nIGN1c3RvbWVyIHdpdGggdGhlIHNhbWUgZW1haWwgb3IgY3JlYXRlIG9uZS5cbiAgICBjb25zdCBbZXhpc3RpbmdDdXN0b21lcl0gPSBhd2FpdCBjdXN0b21lck1vZHVsZS5saXN0Q3VzdG9tZXJzKHsgZW1haWwgfSk7XG5cbiAgICBsZXQgY3VzdG9tZXI6IGFueTtcblxuICAgIGlmIChleGlzdGluZ0N1c3RvbWVyKSB7XG4gICAgICBjdXN0b21lciA9IGV4aXN0aW5nQ3VzdG9tZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIFtjdXN0b21lcl0gPSBhd2FpdCBjdXN0b21lck1vZHVsZS5jcmVhdGVDdXN0b21lcnMoW1xuICAgICAgICB7XG4gICAgICAgICAgZW1haWwsXG4gICAgICAgICAgZmlyc3RfbmFtZTogZ2l2ZW5fbmFtZSxcbiAgICAgICAgICBsYXN0X25hbWU6IGZhbWlseV9uYW1lLFxuICAgICAgICB9LFxuICAgICAgXSk7XG4gICAgfVxuXG4gICAgLy8gQWN0aXZhdGUgdGhlIGFjY291bnQuXG4gICAgYXdhaXQgKGN1c3RvbWVyTW9kdWxlIGFzIGFueSkudXBkYXRlQ3VzdG9tZXJzKGN1c3RvbWVyLmlkLCB7XG4gICAgICBoYXNfYWNjb3VudDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSB0aGUgYXV0aCBpZGVudGl0eSBsaW5rZWQgdG8gdGhpcyBjdXN0b21lci5cbiAgICBhdXRoSWRlbnRpdHkgPSBhd2FpdCBhdXRoTW9kdWxlLmNyZWF0ZUF1dGhJZGVudGl0aWVzKHtcbiAgICAgIHByb3ZpZGVyX2lkZW50aXRpZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGVudGl0eV9pZDogc3ViLFxuICAgICAgICAgIHByb3ZpZGVyLFxuICAgICAgICAgIHByb3ZpZGVyX21ldGFkYXRhOiB7IGVtYWlsLCBnaXZlbl9uYW1lLCBmYW1pbHlfbmFtZSB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGFwcF9tZXRhZGF0YTogeyBjdXN0b21lcl9pZDogY3VzdG9tZXIuaWQgfSxcbiAgICB9KTtcblxuICAgIGN1c3RvbWVySWQgPSBjdXN0b21lci5pZDtcbiAgfVxuXG4gIC8vIEdlbmVyYXRlIHRoZSBNZWR1c2EgY3VzdG9tZXIgSldULlxuICBjb25zdCB0b2tlbiA9IGdlbmVyYXRlSnd0VG9rZW4oXG4gICAge1xuICAgICAgYWN0b3JfaWQ6IGN1c3RvbWVySWQsXG4gICAgICBhY3Rvcl90eXBlOiBcImN1c3RvbWVyXCIsXG4gICAgICBhdXRoX2lkZW50aXR5X2lkOiBhdXRoSWRlbnRpdHkuaWQsXG4gICAgICBhcHBfbWV0YWRhdGE6IHsgY3VzdG9tZXJfaWQ6IGN1c3RvbWVySWQgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHNlY3JldDogaHR0cC5qd3RTZWNyZXQgYXMgc3RyaW5nLFxuICAgICAgZXhwaXJlc0luOiAoaHR0cCBhcyBhbnkpLmp3dEV4cGlyZXNJbiA/PyBcIjFkXCIsXG4gICAgfSxcbiAgKTtcblxuICAvLyBSZWRpcmVjdCBiYWNrIHRvIHRoZSBzdG9yZWZyb250IGNhbGxiYWNrIHBhZ2UuXG4gIGNvbnN0IHJlZGlyZWN0VXJsID0gbmV3IFVSTChcbiAgICBgL2F1dGgvJHtwcm92aWRlcn0vY2FsbGJhY2tgLFxuICAgIHByb3ZpZGVyQ29uZmlnLnN1Y2Nlc3NfcmVkaXJlY3RfdXJsLFxuICApO1xuICByZWRpcmVjdFVybC5zZWFyY2hQYXJhbXMuc2V0KFwidG9rZW5cIiwgdG9rZW4pO1xuICByZWRpcmVjdFVybC5zZWFyY2hQYXJhbXMuc2V0KFwicmV0dXJuX3RvXCIsIHJldHVyblRvKTtcblxuICByZXMucmVkaXJlY3QoMzAyLCByZWRpcmVjdFVybC50b1N0cmluZygpKTtcbn07XG4iXSwibmFtZXMiOlsiR0VUIiwiUFJPVklERVJfRVhDSEFOR0VfVVJMUyIsImdvb2dsZSIsInJlcSIsInJlcyIsInByb3ZpZGVyIiwicGFyYW1zIiwiY29kZSIsInN0YXRlIiwicXVlcnkiLCJjb25zb2xlIiwibG9nIiwic3RhdHVzIiwianNvbiIsIm1lc3NhZ2UiLCJvYXV0aFNlcnZpY2UiLCJzY29wZSIsInJlc29sdmUiLCJPQVVUSF9NT0RVTEUiLCJjb25maWciLCJDb250YWluZXJSZWdpc3RyYXRpb25LZXlzIiwiQ09ORklHX01PRFVMRSIsImF1dGhNb2R1bGUiLCJNb2R1bGVzIiwiQVVUSCIsImN1c3RvbWVyTW9kdWxlIiwiQ1VTVE9NRVIiLCJwcm92aWRlckNvbmZpZyIsImxpc3RPQXV0aFByb3ZpZGVyQ29uZmlncyIsImVuYWJsZWQiLCJodHRwIiwicHJvamVjdENvbmZpZyIsInN0YXRlUGF5bG9hZCIsImp3dCIsInZlcmlmeSIsInRvU3RyaW5nIiwiand0U2VjcmV0IiwicmV0dXJuVG8iLCJyZXR1cm5fdG8iLCJzdGFydHNXaXRoIiwiZXhjaGFuZ2VVcmwiLCJ0b2tlblJlc3BvbnNlIiwiZmV0Y2giLCJtZXRob2QiLCJoZWFkZXJzIiwiYm9keSIsIlVSTFNlYXJjaFBhcmFtcyIsImNsaWVudF9pZCIsImNsaWVudF9zZWNyZXQiLCJyZWRpcmVjdF91cmkiLCJjYWxsYmFja191cmwiLCJncmFudF90eXBlIiwib2siLCJ0b2tlbkRhdGEiLCJpZF90b2tlbiIsImlkUGF5bG9hZCIsImRlY29kZSIsInN1YiIsImVtYWlsIiwiZ2l2ZW5fbmFtZSIsImZhbWlseV9uYW1lIiwiZXhpc3RpbmdJZGVudGl0eSIsImxpc3RBdXRoSWRlbnRpdGllcyIsInByb3ZpZGVyX2lkZW50aXRpZXMiLCJlbnRpdHlfaWQiLCJyZWxhdGlvbnMiLCJhdXRoSWRlbnRpdHkiLCJjdXN0b21lcklkIiwiYXBwX21ldGFkYXRhIiwiY3VzdG9tZXJfaWQiLCJleGlzdGluZ0N1c3RvbWVyIiwibGlzdEN1c3RvbWVycyIsImN1c3RvbWVyIiwiY3JlYXRlQ3VzdG9tZXJzIiwiZmlyc3RfbmFtZSIsImxhc3RfbmFtZSIsInVwZGF0ZUN1c3RvbWVycyIsImlkIiwiaGFzX2FjY291bnQiLCJjcmVhdGVBdXRoSWRlbnRpdGllcyIsInByb3ZpZGVyX21ldGFkYXRhIiwidG9rZW4iLCJnZW5lcmF0ZUp3dFRva2VuIiwiYWN0b3JfaWQiLCJhY3Rvcl90eXBlIiwiYXV0aF9pZGVudGl0eV9pZCIsInNlY3JldCIsImV4cGlyZXNJbiIsImp3dEV4cGlyZXNJbiIsInJlZGlyZWN0VXJsIiwiVVJMIiwic3VjY2Vzc19yZWRpcmVjdF91cmwiLCJzZWFyY2hQYXJhbXMiLCJzZXQiLCJyZWRpcmVjdCJdLCJtYXBwaW5ncyI6Ijs7OzsrQkFxQmFBOzs7ZUFBQUE7Ozt1QkFoQnNDO3dCQUNsQjt1QkFDdUI7cUVBQ3hDOzs7Ozs7QUFFaEIsTUFBTUMseUJBQWlEO0lBQ3JEQyxRQUFR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