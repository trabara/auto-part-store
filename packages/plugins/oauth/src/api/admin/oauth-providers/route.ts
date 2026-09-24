import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { upsertOAuthProviderWorkflow } from "../../../workflows";
import type { UpsertOAuthProviderBody } from "./middlewares";
import OAuthProviderService from "../../../modules/oauth/service";
import { OAUTH_MODULE } from "../../../modules/oauth/constant";

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
