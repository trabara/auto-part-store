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


export const assignRoleStep = createStep(
  "assign-role-step",
  async (input: AssignRoleStepInput, { container }) => {
    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

    // Capture the user's current membership before making any change so we
    // can restore it precisely during compensation instead of wiping the
    // entire role's member list.
    const [existingMember] = await service.listAuthzMembers({ user_id: input.userId });

    const compensation: AssignRoleStepCompensation = {
      userId: input.userId,
      previousMemberId: existingMember?.id ?? null,
      previousRoleId: existingMember?.role?.id ?? null,
    };

    await service.assignRbacUsers(input.roleId, { userIds: [input.userId] });

    return new StepResponse({ roleId: input.roleId }, compensation);
  },
  async (
    compensation: AssignRoleStepCompensation | undefined,
    { container },
  ) => {
    if (!compensation) return;

    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
    const { userId, previousMemberId, previousRoleId } = compensation;

    if (previousMemberId && previousRoleId) {
      // User had a role before — restore the original assignment.
      await service.updateAuthzMembers([
        { id: previousMemberId, role_id: previousRoleId },
      ]);
    } else {
      // User had no role before — delete the member record that was just created.
      const [createdMember] = await service.listAuthzMembers({ user_id: userId });
      if (createdMember) {
        await service.deleteAuthzMembers({ id: createdMember.id });
      }
    }
  },
);
