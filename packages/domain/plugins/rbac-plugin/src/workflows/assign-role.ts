import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { assignRoleStep } from "./steps/assign-role";

type AssignRoleWorkflowInput = {
  userId: string;
  roleId: string;
};

export const assignRoleWorkflow = createWorkflow(
  "assign-role",
  function (input: AssignRoleWorkflowInput) {
    const result = assignRoleStep(input);
    return new WorkflowResponse(result);
  },
);
