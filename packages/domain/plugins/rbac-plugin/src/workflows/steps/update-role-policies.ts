import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";

type UpdateRolePoliciesStepInput = {
  roleId: string;
  permissionIds: string[];
};

type UpdateRolePoliciesStepCompensation = {
  roleId: string;
  previousPermissionIds: string[];
};

export const updateRolePoliciesStep = createStep(
  "update-role-policies-step",
  async (input: UpdateRolePoliciesStepInput, { container }) => {
    const service = container.resolve(AUTHZ_MODULE) as AuthzModuleService;

    // Snapshot the current policies so compensation can restore them.
    const existingPolicies = await service.listAuthzPolicies({ role_id: input.roleId });
    const previousPermissionIds = existingPolicies.map(
      (p) => p.permission_id,
    );

    await service.updateRolePolicies(input.roleId, input.permissionIds);
    return new StepResponse({ roleId: input.roleId }, { roleId: input.roleId, previousPermissionIds });
  },
  async (
    compensation: UpdateRolePoliciesStepCompensation | undefined,
    { container },
  ) => {
    if (!compensation) return;

    const service = container.resolve(AUTHZ_MODULE) as AuthzModuleService;
    await service.updateRolePolicies(
      compensation.roleId,
      compensation.previousPermissionIds,
    );
  },
);
