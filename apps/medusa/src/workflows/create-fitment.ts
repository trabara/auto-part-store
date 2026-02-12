import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { CreateFitmentInput } from "../modules/fitment/schema";
import { createFitmentStep } from "./steps/create-fitment";

export const createFitmentWorkflow = createWorkflow(
    "create-fitment-workflow",
    function (input: CreateFitmentInput) {
        return new WorkflowResponse(createFitmentStep(input));
    }
)