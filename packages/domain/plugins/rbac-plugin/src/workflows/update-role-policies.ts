import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { updateRolePoliciesStep } from "./steps/update-role-policies";

type UpdateRolePoliciesWorkflowInput = {
  roleId: string;
  permissionIds: string[];
};

export const updateRolePoliciesWorkflow = createWorkflow(
  "update-role-policies",
  function (input: UpdateRolePoliciesWorkflowInput) {
    const result = updateRolePoliciesStep(input);
    return new WorkflowResponse(result);
  },
);
