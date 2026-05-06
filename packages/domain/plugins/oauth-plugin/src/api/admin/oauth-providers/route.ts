import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { OAUTH_MODULE, type OAuthProviderService } from "@repo/domain-modules/oauth";
import { upsertOAuthProviderWorkflow } from "../../../workflows";
import type { UpsertOAuthProviderBody } from "./middlewares";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<OAuthProviderService>(OAUTH_MODULE);
  const configs = await service.listOAuthProviderConfigs();
  res.json({ oauth_providers: configs });
};

export const POST = async (
  req: MedusaRequest<UpsertOAuthProviderBody>,
  res: MedusaResponse,
) => {
  const { result } = await upsertOAuthProviderWorkflow(req.scope).run({
    input: req.validatedBody,
  });
  res.status(200).json({ oauth_provider: result.config });
};
