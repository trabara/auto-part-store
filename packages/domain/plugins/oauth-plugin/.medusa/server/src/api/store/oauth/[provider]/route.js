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
const _oauth = require("@repo/domain-modules/oauth");
const _jsonwebtoken = /*#__PURE__*/ _interop_require_default(require("jsonwebtoken"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const PROVIDER_URLS = {
    google: "https://accounts.google.com/o/oauth2/v2/auth",
    facebook: "https://www.facebook.com/v10.0/dialog/oauth",
    apple: "https://appleid.apple.com/auth/authorize"
};
const GET = async (req, res)=>{
    const { provider } = req.params;
    const service = req.scope.resolve(_oauth.OAUTH_MODULE);
    const config = req.scope.resolve(_utils.ContainerRegistrationKeys.CONFIG_MODULE);
    const [providerConfig] = await service.listOAuthProviderConfigs({
        provider: provider,
        enabled: true
    });
    if (!providerConfig) {
        res.status(404).json({
            message: `${provider} OAuth provider not configured or disabled`
        });
        return;
    }
    const returnTo = req.query.return_to || "/account";
    const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/account";
    // Build a short-lived state JWT to carry return_to and a nonce.
    const { http } = config.projectConfig;
    const state = _jsonwebtoken.default.sign({
        return_to: safeReturnTo,
        nonce: Math.random().toString(36).slice(2)
    }, http.jwtSecret, {
        expiresIn: "10m"
    });
    const params = new URLSearchParams({
        client_id: providerConfig.client_id,
        redirect_uri: providerConfig.callback_url,
        response_type: "code",
        scope: "openid email profile",
        state
    });
    const location = `${PROVIDER_URLS[provider]}?${params.toString()}`;
    res.json({
        location
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcGkvc3RvcmUvb2F1dGgvW3Byb3ZpZGVyXS9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNZWR1c2FSZXF1ZXN0LCBNZWR1c2FSZXNwb25zZSB9IGZyb20gXCJAbWVkdXNhanMvZnJhbWV3b3JrL2h0dHBcIjtcbmltcG9ydCB7IENvbnRhaW5lclJlZ2lzdHJhdGlvbktleXMgfSBmcm9tIFwiQG1lZHVzYWpzL2ZyYW1ld29yay91dGlsc1wiO1xuaW1wb3J0IHsgT0FVVEhfTU9EVUxFLCB0eXBlIE9BdXRoUHJvdmlkZXJTZXJ2aWNlIH0gZnJvbSBcIkByZXBvL2RvbWFpbi1tb2R1bGVzL29hdXRoXCI7XG5pbXBvcnQgand0IGZyb20gXCJqc29ud2VidG9rZW5cIjtcblxuY29uc3QgUFJPVklERVJfVVJMUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgZ29vZ2xlOiBcImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi92Mi9hdXRoXCIsXG4gIGZhY2Vib29rOiBcImh0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS92MTAuMC9kaWFsb2cvb2F1dGhcIixcbiAgYXBwbGU6IFwiaHR0cHM6Ly9hcHBsZWlkLmFwcGxlLmNvbS9hdXRoL2F1dGhvcml6ZVwiLFxufVxuXG4vKipcbiAqIEdFVCAvc3RvcmUvYXV0aC9nb29nbGU/cmV0dXJuX3RvPS9jaGVja291dFxuICpcbiAqIFJldHVybnMgdGhlIEdvb2dsZSBPQXV0aCBhdXRob3JpemF0aW9uIFVSTC4gVGhlIGNsaWVudCBzaG91bGQgcmVkaXJlY3RcbiAqIHRoZSBicm93c2VyIHRvIHRoYXQgVVJMLlxuICovXG5leHBvcnQgY29uc3QgR0VUID0gYXN5bmMgKHJlcTogTWVkdXNhUmVxdWVzdDx7IHByb3ZpZGVyOiBzdHJpbmcgfT4sIHJlczogTWVkdXNhUmVzcG9uc2UpID0+IHtcbiAgY29uc3QgeyBwcm92aWRlciB9ID0gcmVxLnBhcmFtc1xuICBjb25zdCBzZXJ2aWNlID0gcmVxLnNjb3BlLnJlc29sdmU8T0F1dGhQcm92aWRlclNlcnZpY2U+KE9BVVRIX01PRFVMRSk7XG4gIGNvbnN0IGNvbmZpZyA9IHJlcS5zY29wZS5yZXNvbHZlKENvbnRhaW5lclJlZ2lzdHJhdGlvbktleXMuQ09ORklHX01PRFVMRSk7XG5cbiAgY29uc3QgW3Byb3ZpZGVyQ29uZmlnXSA9IGF3YWl0IHNlcnZpY2UubGlzdE9BdXRoUHJvdmlkZXJDb25maWdzKHtcbiAgICBwcm92aWRlcjogcHJvdmlkZXIsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgfSk7XG5cbiAgaWYgKCFwcm92aWRlckNvbmZpZykge1xuICAgIHJlc1xuICAgICAgLnN0YXR1cyg0MDQpXG4gICAgICAuanNvbih7IG1lc3NhZ2U6IGAke3Byb3ZpZGVyfSBPQXV0aCBwcm92aWRlciBub3QgY29uZmlndXJlZCBvciBkaXNhYmxlZGAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcmV0dXJuVG8gPSAocmVxLnF1ZXJ5LnJldHVybl90byBhcyBzdHJpbmcpIHx8IFwiL2FjY291bnRcIjtcbiAgY29uc3Qgc2FmZVJldHVyblRvID0gcmV0dXJuVG8uc3RhcnRzV2l0aChcIi9cIikgPyByZXR1cm5UbyA6IFwiL2FjY291bnRcIjtcblxuICAvLyBCdWlsZCBhIHNob3J0LWxpdmVkIHN0YXRlIEpXVCB0byBjYXJyeSByZXR1cm5fdG8gYW5kIGEgbm9uY2UuXG4gIGNvbnN0IHsgaHR0cCB9ID0gY29uZmlnLnByb2plY3RDb25maWc7XG4gIGNvbnN0IHN0YXRlID0gand0LnNpZ24oXG4gICAgeyByZXR1cm5fdG86IHNhZmVSZXR1cm5Ubywgbm9uY2U6IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpIH0sXG4gICAgaHR0cC5qd3RTZWNyZXQgYXMgc3RyaW5nLFxuICAgIHsgZXhwaXJlc0luOiBcIjEwbVwiIH0sXG4gICk7XG5cbiAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh7XG4gICAgY2xpZW50X2lkOiBwcm92aWRlckNvbmZpZy5jbGllbnRfaWQsXG4gICAgcmVkaXJlY3RfdXJpOiBwcm92aWRlckNvbmZpZy5jYWxsYmFja191cmwsXG4gICAgcmVzcG9uc2VfdHlwZTogXCJjb2RlXCIsXG4gICAgc2NvcGU6IFwib3BlbmlkIGVtYWlsIHByb2ZpbGVcIixcbiAgICBzdGF0ZSxcbiAgfSk7XG5cbiAgY29uc3QgbG9jYXRpb24gPSBgJHtQUk9WSURFUl9VUkxTW3Byb3ZpZGVyXX0/JHtwYXJhbXMudG9TdHJpbmcoKX1gO1xuXG4gIHJlcy5qc29uKHsgbG9jYXRpb24gfSk7XG59O1xuIl0sIm5hbWVzIjpbIkdFVCIsIlBST1ZJREVSX1VSTFMiLCJnb29nbGUiLCJmYWNlYm9vayIsImFwcGxlIiwicmVxIiwicmVzIiwicHJvdmlkZXIiLCJwYXJhbXMiLCJzZXJ2aWNlIiwic2NvcGUiLCJyZXNvbHZlIiwiT0FVVEhfTU9EVUxFIiwiY29uZmlnIiwiQ29udGFpbmVyUmVnaXN0cmF0aW9uS2V5cyIsIkNPTkZJR19NT0RVTEUiLCJwcm92aWRlckNvbmZpZyIsImxpc3RPQXV0aFByb3ZpZGVyQ29uZmlncyIsImVuYWJsZWQiLCJzdGF0dXMiLCJqc29uIiwibWVzc2FnZSIsInJldHVyblRvIiwicXVlcnkiLCJyZXR1cm5fdG8iLCJzYWZlUmV0dXJuVG8iLCJzdGFydHNXaXRoIiwiaHR0cCIsInByb2plY3RDb25maWciLCJzdGF0ZSIsImp3dCIsInNpZ24iLCJub25jZSIsIk1hdGgiLCJyYW5kb20iLCJ0b1N0cmluZyIsInNsaWNlIiwiand0U2VjcmV0IiwiZXhwaXJlc0luIiwiVVJMU2VhcmNoUGFyYW1zIiwiY2xpZW50X2lkIiwicmVkaXJlY3RfdXJpIiwiY2FsbGJhY2tfdXJsIiwicmVzcG9uc2VfdHlwZSIsImxvY2F0aW9uIl0sIm1hcHBpbmdzIjoiOzs7OytCQWlCYUE7OztlQUFBQTs7O3VCQWhCNkI7dUJBQ2M7cUVBQ3hDOzs7Ozs7QUFFaEIsTUFBTUMsZ0JBQXdDO0lBQzVDQyxRQUFRO0lBQ1JDLFVBQVU7SUFDVkMsT0FBTztBQUNUO0FBUU8sTUFBTUosTUFBTSxPQUFPSyxLQUEwQ0M7SUFDbEUsTUFBTSxFQUFFQyxRQUFRLEVBQUUsR0FBR0YsSUFBSUcsTUFBTTtJQUMvQixNQUFNQyxVQUFVSixJQUFJSyxLQUFLLENBQUNDLE9BQU8sQ0FBdUJDLG1CQUFZO0lBQ3BFLE1BQU1DLFNBQVNSLElBQUlLLEtBQUssQ0FBQ0MsT0FBTyxDQUFDRyxnQ0FBeUIsQ0FBQ0MsYUFBYTtJQUV4RSxNQUFNLENBQUNDLGVBQWUsR0FBRyxNQUFNUCxRQUFRUSx3QkFBd0IsQ0FBQztRQUM5RFYsVUFBVUE7UUFDVlcsU0FBUztJQUNYO0lBRUEsSUFBSSxDQUFDRixnQkFBZ0I7UUFDbkJWLElBQ0dhLE1BQU0sQ0FBQyxLQUNQQyxJQUFJLENBQUM7WUFBRUMsU0FBUyxHQUFHZCxTQUFTLDBDQUEwQyxDQUFDO1FBQUM7UUFDM0U7SUFDRjtJQUVBLE1BQU1lLFdBQVcsQUFBQ2pCLElBQUlrQixLQUFLLENBQUNDLFNBQVMsSUFBZTtJQUNwRCxNQUFNQyxlQUFlSCxTQUFTSSxVQUFVLENBQUMsT0FBT0osV0FBVztJQUUzRCxnRUFBZ0U7SUFDaEUsTUFBTSxFQUFFSyxJQUFJLEVBQUUsR0FBR2QsT0FBT2UsYUFBYTtJQUNyQyxNQUFNQyxRQUFRQyxxQkFBRyxDQUFDQyxJQUFJLENBQ3BCO1FBQUVQLFdBQVdDO1FBQWNPLE9BQU9DLEtBQUtDLE1BQU0sR0FBR0MsUUFBUSxDQUFDLElBQUlDLEtBQUssQ0FBQztJQUFHLEdBQ3RFVCxLQUFLVSxTQUFTLEVBQ2Q7UUFBRUMsV0FBVztJQUFNO0lBR3JCLE1BQU05QixTQUFTLElBQUkrQixnQkFBZ0I7UUFDakNDLFdBQVd4QixlQUFld0IsU0FBUztRQUNuQ0MsY0FBY3pCLGVBQWUwQixZQUFZO1FBQ3pDQyxlQUFlO1FBQ2ZqQyxPQUFPO1FBQ1BtQjtJQUNGO0lBRUEsTUFBTWUsV0FBVyxHQUFHM0MsYUFBYSxDQUFDTSxTQUFTLENBQUMsQ0FBQyxFQUFFQyxPQUFPMkIsUUFBUSxJQUFJO0lBRWxFN0IsSUFBSWMsSUFBSSxDQUFDO1FBQUV3QjtJQUFTO0FBQ3RCIn0=