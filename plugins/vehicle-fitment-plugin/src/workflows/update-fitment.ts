import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { UpdateFitmentInput } from "../modules/fitment/schema";
import { updateFitmentStep } from "./steps/update-fitment";

export const updateFitmentWorkflow = createWorkflow(
  "update-fitment-workflow",
  function (input: UpdateFitmentInput) {
    const updatedFitment = updateFitmentStep(input);

    return new WorkflowResponse({
      fitment: updatedFitment,
    });
  },
);

export default updateFitmentWorkflow;
