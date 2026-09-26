import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { updateFitmentStep } from "./steps/update-fitment";
import { UpdateVehicleInput } from "../modules/fitment/dtos/vehicle";

export const updateFitmentWorkflow = createWorkflow(
  "update-fitment-workflow",
  function (input: UpdateVehicleInput) {
    const updatedFitment = updateFitmentStep(input);

    return new WorkflowResponse({
      fitment: updatedFitment,
    });
  },
);
