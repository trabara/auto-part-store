import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { AUTHZ_MODULE, AuthzModuleService } from "../modules/authz";

type AssignRoleWorkflowInput = {
  userId: string;
  roleId: string;
};

const assignRoleStep = createStep(
  "assign-role-step",
  async ({ roleId, userId }: AssignRoleWorkflowInput, { container }) => {
    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

    await service.assignRbacUsers(roleId, { userIds: [userId] });

    return new StepResponse({ roleId });
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

    await service.assignRbacUsers(compensation.roleId, {
      userIds: [],
    });
  },
);

export const assignRoleWorkflow = createWorkflow(
  "assign-role",
  function (input: AssignRoleWorkflowInput) {
    const result = assignRoleStep(input);
    return new WorkflowResponse(result);
  },
);
