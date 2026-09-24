import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  upsertOAuthProviderStep,
  type UpsertOAuthProviderStepInput,
} from "./steps/upsert-oauth-provider";

export const upsertOAuthProviderWorkflow = createWorkflow(
  "upsert-oauth-provider-workflow",
  function (input: UpsertOAuthProviderStepInput) {
    const { config } = upsertOAuthProviderStep(input);
    return new WorkflowResponse({ config });
  },
);
