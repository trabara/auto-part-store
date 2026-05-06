import type { IAuthModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

type Input = {
  auth_identity_id: string;
  customer_id: string;
};


export const linkAuthIdentityToCustomerStep = createStep(
  "link-auth-identity-to-customer",
  async (input: Input, { container }) => {
    const authModule = container.resolve<IAuthModuleService>(Modules.AUTH);

    await authModule.updateAuthIdentities({
      id: input.auth_identity_id,
      app_metadata: {
        customer_id: input.customer_id,
      },
    });

    return new StepResponse({ success: true }, {
      auth_identity_id: input.auth_identity_id,
    });
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return;
    }

    const authModule = container.resolve<IAuthModuleService>(Modules.AUTH);

    await authModule.updateAuthIdentities({
      id: compensation.auth_identity_id,
      app_metadata: {
        customer_id: null,
      },
    });
  },
);
