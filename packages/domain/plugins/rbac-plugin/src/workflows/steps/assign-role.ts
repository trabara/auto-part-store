import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";

type AssignRoleStepInput = {
  userId: string;
  roleId: string;
};

type AssignRoleStepCompensation = {
  userId: string;
  /** The member id that previously existed for this user, if any. */
  previousMemberId: string | null;
  /** The role id the user was previously assigned to, if any. */
  previousRoleId: string | null;
};

// ---------------------------------------------------------------------------
// Named handler functions — exported for unit testing
// ---------------------------------------------------------------------------

export async function invokeAssignRole(
  { roleId, userId }: AssignRoleStepInput,
  container: { resolve: (key: string) => any },
): Promise<{
  output: { roleId: string };
  compensation: AssignRoleStepCompensation;
}> {
  const service = container.resolve(AUTHZ_MODULE) as AuthzModuleService;

  // Capture the user's current membership before making any change so we
  // can restore it precisely during compensation instead of wiping the
  // entire role's member list.
  const [existingMember] = await service.members.list({ user_id: userId });

  const compensation: AssignRoleStepCompensation = {
    userId,
    previousMemberId: existingMember?.id ?? null,
    previousRoleId: existingMember?.role?.id ?? null,
  };

  await service.assignRbacUsers(roleId, { userIds: [userId] });

  return { output: { roleId }, compensation };
}

export async function compensateAssignRole(
  compensation: AssignRoleStepCompensation | undefined,
  container: { resolve: (key: string) => any },
): Promise<void> {
  if (!compensation) return;

  const service = container.resolve(AUTHZ_MODULE) as AuthzModuleService;
  const { userId, previousMemberId, previousRoleId } = compensation;

  if (previousMemberId && previousRoleId) {
    // User had a role before — restore the original assignment.
    await service.members.update([
      { id: previousMemberId, role_id: previousRoleId },
    ]);
  } else {
    // User had no role before — delete the member record that was just created.
    const [createdMember] = await service.members.list({ user_id: userId });
    if (createdMember) {
      await service.members.delete({ id: createdMember.id });
    }
  }
}

// ---------------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------------

export const assignRoleStep = createStep(
  "assign-role-step",
  async (input: AssignRoleStepInput, { container }) => {
    const { output, compensation } = await invokeAssignRole(input, container);
    return new StepResponse(output, compensation);
  },
  async (
    compensation: AssignRoleStepCompensation | undefined,
    { container },
  ) => {
    await compensateAssignRole(compensation, container);
  },
);
