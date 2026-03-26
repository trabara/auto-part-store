import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { RBAC_MODULE } from "../modules/rbac";

type AssignRoleWorkflowInput = {
  user_id: string;
  role_id: string | null;
};

const assignRoleStep = createStep(
  "assign-role-step",
  async (input: AssignRoleWorkflowInput, { container }) => {
    const service = container.resolve<any>(RBAC_MODULE);

    const [existingMembers] = await service.listAndCountRbacMembers({
      user_id: input.user_id,
    });

    let member: any;

    if (existingMembers.length > 0) {
      member = existingMembers[0];
      if (input.role_id === null) {
        await service.updateRbacMembers(member.id, { role_id: null });
      } else {
        await service.updateRbacMembers(member.id, { role_id: input.role_id });
      }
    } else {
      member = await service.createRbacMembers({
        user_id: input.user_id,
        role_id: input.role_id,
      });
    }

    return new StepResponse(member, {
      memberId: member.id,
      previousRoleId: member.role_id,
    });
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<any>(RBAC_MODULE);

    await service.updateRbacMembers(compensation.memberId, {
      role_id: compensation.previousRoleId,
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
