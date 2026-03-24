import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { dismissFitmentLinksStep } from "./steps/dismiss-fitment-links";
import { deleteFitmentsStep } from "./steps/delete-fitments";

type DeleteFitmentWorkflowInput = {
  id: string;
};

type DeleteFitmentWorkflowOutput = {
  id: string;
  deleted: boolean;
};

/**
 * Workflow to delete a fitment with proper link cleanup
 *
 * Steps:
 * 1. Dismiss all product-fitment links (with compensation to restore if needed)
 * 2. Delete the fitment entity (with compensation to restore if needed)
 *
 * This ensures no orphaned links remain when a fitment is deleted
 */
export const deleteFitmentWorkflow = createWorkflow(
  "delete-fitment-workflow",
  function (
    input: DeleteFitmentWorkflowInput,
  ): WorkflowResponse<DeleteFitmentWorkflowOutput> {
    // Step 1: Dismiss all product links for this fitment
    dismissFitmentLinksStep({ fitment_ids: [input.id] });

    // Step 2: Delete the fitment entity
    deleteFitmentsStep({ ids: [input.id] });

    return new WorkflowResponse({
      id: input.id,
      deleted: true,
    });
  },
);
