import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { OAUTH_MODULE, type OAuthProviderService } from "@repo/domain-modules/oauth";

export type UpsertOAuthProviderStepInput = {
  provider: string;
  client_id: string;
  client_secret: string;
  callback_url: string;
  success_redirect_url: string;
  enabled: boolean;
};

type CompensationInput = { id: string; isNew: boolean };

export const upsertOAuthProviderStep = createStep<
  UpsertOAuthProviderStepInput,
  { config: any },
  CompensationInput
>(
  "upsert-oauth-provider-step",
  async (input, { container }) => {
    const service = container.resolve<OAuthProviderService>(OAUTH_MODULE);

    const [existing] = await service.listOAuthProviderConfigs({
      provider: input.provider,
    });

    let config: any;
    let isNew = false;

    if (existing) {
      [config] = await service.updateOAuthProviderConfigs([
        { id: existing.id, ...input },
      ]);
    } else {
      [config] = await service.createOAuthProviderConfigs([input]);
      isNew = true;
    }

    return new StepResponse({ config }, { id: config.id, isNew });
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<OAuthProviderService>(OAUTH_MODULE);

    if (compensation.isNew) {
      await service.deleteOAuthProviderConfigs([compensation.id]);
    }
  },
);
