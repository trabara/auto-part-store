import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { OAUTH_MODULE, type OAuthProviderService } from "@repo/domain-modules/oauth";

export const deleteOAuthProviderStep = createStep<
  { id: string },
  { deleted: boolean },
  { config: any }
>(
  "delete-oauth-provider-step",
  async (input, { container }) => {
    const service = container.resolve<OAuthProviderService>(OAUTH_MODULE);

    const [existing] = await service.listOAuthProviderConfigs({ id: input.id });

    if (!existing) {
      return new StepResponse({ deleted: false }, null as any);
    }

    await service.deleteOAuthProviderConfigs([input.id]);

    return new StepResponse({ deleted: true }, { config: existing });
  },
  async (compensation, { container }) => {
    if (!compensation?.config) return;

    const service = container.resolve<OAuthProviderService>(OAUTH_MODULE);
    await service.createOAuthProviderConfigs([compensation.config]);
  },
);
