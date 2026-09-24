import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { deleteOAuthProviderStep } from "./steps/delete-oauth-provider";

export const deleteOAuthProviderWorkflow = createWorkflow(
  "delete-oauth-provider-workflow",
  function (input: { id: string }) {
    const { deleted } = deleteOAuthProviderStep(input);
    return new WorkflowResponse({ deleted });
  },
);
