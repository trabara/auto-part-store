import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";

type AssignRoleStepInput = {
  userId: string;
  roleId: string;
};

export const assignRoleStep = createStep(
  "assign-role-step",
  async ({ roleId, userId }: AssignRoleStepInput, { container }) => {
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
