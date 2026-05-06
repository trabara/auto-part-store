import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { OAUTH_MODULE, OAuthProviderService } from "@repo/domain-modules/oauth";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
    const service = req.scope.resolve<OAuthProviderService>(OAUTH_MODULE);
    const configs = await service.listOAuthProviderConfigs({ enabled: true }, { select: ["provider"] });
    res.status(200).json({ enabled_providers: configs.map(c => c.provider) });
}
