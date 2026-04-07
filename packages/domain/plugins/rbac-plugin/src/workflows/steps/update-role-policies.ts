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

// ---------------------------------------------------------------------------
// Named handler functions — exported for unit testing
// ---------------------------------------------------------------------------

export async function invokeUpdateRolePolicies(
  { roleId, permissionIds }: UpdateRolePoliciesStepInput,
  container: { resolve: (key: string) => any },
): Promise<{
  output: { roleId: string };
  compensation: UpdateRolePoliciesStepCompensation;
}> {
  const service = container.resolve(AUTHZ_MODULE) as AuthzModuleService;

  // Snapshot the current policies so compensation can restore them.
  const existingPolicies = await service.policies.list({ role_id: roleId });
  const previousPermissionIds = existingPolicies.map(
    (p: any) => p.permission_id,
  );

  await service.updateRolePolicies(roleId, permissionIds);

  return {
    output: { roleId },
    compensation: { roleId, previousPermissionIds },
  };
}

export async function compensateUpdateRolePolicies(
  compensation: UpdateRolePoliciesStepCompensation | undefined,
  container: { resolve: (key: string) => any },
): Promise<void> {
  if (!compensation) return;

  const service = container.resolve(AUTHZ_MODULE) as AuthzModuleService;
  await service.updateRolePolicies(
    compensation.roleId,
    compensation.previousPermissionIds,
  );
}

// ---------------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------------

export const updateRolePoliciesStep = createStep(
  "update-role-policies-step",
  async (input: UpdateRolePoliciesStepInput, { container }) => {
    const { output, compensation } = await invokeUpdateRolePolicies(
      input,
      container,
    );
    return new StepResponse(output, compensation);
  },
  async (
    compensation: UpdateRolePoliciesStepCompensation | undefined,
    { container },
  ) => {
    await compensateUpdateRolePolicies(compensation, container);
  },
);
