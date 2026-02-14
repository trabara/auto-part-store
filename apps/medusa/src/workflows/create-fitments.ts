import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { CreateFitmentInput } from "../modules/fitment/schema";
import { createFitmentsStep } from "./steps/create-fitment";

type CreateFitmentWorkflowInput = {
    fitments: CreateFitmentInput[]
    product_id?: string
}
export const createFitmentsWorkflow = createWorkflow(
    "create-fitments-workflow",
    function (input: CreateFitmentWorkflowInput) {

        const fitments = createFitmentsStep(input)

        return new WorkflowResponse({ fitments });
    }
)