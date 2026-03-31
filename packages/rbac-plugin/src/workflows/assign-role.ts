import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { AUTHZ_MODULE, AuthzModuleService } from "../modules/authz";

type AssignRoleWorkflowInput = {
  user_id: string;
  role_id: string;
};

const assignRoleStep = createStep(
  "assign-role-step",
  async ({ role_id, user_id }: AssignRoleWorkflowInput, { container }) => {
    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

    await service.assignRbacUsers(role_id, { userIds: [user_id] });

    return new StepResponse();
  },
  // async (compensation, { container }) => {
  //   if (!compensation) return;

  //   const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

  //   await service.updateAuthzMembers(compensation.memberId, {
  //     role_id: compensation.previousRoleId,
  //   });
  // },
);

export const assignRoleWorkflow = createWorkflow(
  "assign-role",
  function (input: AssignRoleWorkflowInput) {
    const result = assignRoleStep(input);
    return new WorkflowResponse(result);
  },
);
