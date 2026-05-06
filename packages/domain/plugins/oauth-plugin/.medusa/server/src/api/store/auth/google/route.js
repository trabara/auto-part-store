"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const oauth_1 = require("@repo/domain-modules/oauth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * GET /store/auth/google?return_to=/checkout
 *
 * Returns the Google OAuth authorization URL. The client should redirect
 * the browser to that URL.
 */
const GET = async (req, res) => {
    const service = req.scope.resolve(oauth_1.OAUTH_MODULE);
    const config = req.scope.resolve(utils_1.ContainerRegistrationKeys.CONFIG_MODULE);
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
    const returnTo = req.query.return_to || "/account";
    const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/account";
    // Build a short-lived state JWT to carry return_to and a nonce.
    const { http } = config.projectConfig;
    const state = jsonwebtoken_1.default.sign({ return_to: safeReturnTo, nonce: Math.random().toString(36).slice(2) }, http.jwtSecret, { expiresIn: "10m" });
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
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2F1dGgvZ29vZ2xlL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLHFEQUFzRTtBQUN0RSxzREFBcUY7QUFDckYsZ0VBQStCO0FBRS9COzs7OztHQUtHO0FBQ0ksTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ25FLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUF1QixvQkFBWSxDQUFDLENBQUM7SUFDdEUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsaUNBQXlCLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFMUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLHdCQUF3QixDQUFDO1FBQ3hELFFBQVEsRUFBRSxRQUFRO1FBQ2xCLE9BQU8sRUFBRSxJQUFJO0tBQ2QsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2QsR0FBRzthQUNBLE1BQU0sQ0FBQyxHQUFHLENBQUM7YUFDWCxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsa0RBQWtELEVBQUUsQ0FBQyxDQUFDO1FBQ3pFLE9BQU87SUFDVCxDQUFDO0lBRUQsTUFBTSxRQUFRLEdBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFvQixJQUFJLFVBQVUsQ0FBQztJQUMvRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztJQUV0RSxnRUFBZ0U7SUFDaEUsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7SUFDdEMsTUFBTSxLQUFLLEdBQUcsc0JBQUcsQ0FBQyxJQUFJLENBQ3BCLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFDdkUsSUFBSSxDQUFDLFNBQW1CLEVBQ3hCLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUNyQixDQUFDO0lBRUYsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFlLENBQUM7UUFDakMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTO1FBQzdCLFlBQVksRUFBRSxRQUFRLENBQUMsWUFBWTtRQUNuQyxhQUFhLEVBQUUsTUFBTTtRQUNyQixLQUFLLEVBQUUsc0JBQXNCO1FBQzdCLEtBQUs7S0FDTixDQUFDLENBQUM7SUFFSCxNQUFNLFFBQVEsR0FBRyxnREFBZ0QsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7SUFFckYsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDO0FBdENXLFFBQUEsR0FBRyxPQXNDZCJ9