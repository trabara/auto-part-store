import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";
import { CreateRoleInput } from "@trabara/core/dtos";

export const createRbacRolesStep = createStep(
  "create-rbac-roles-step",
  async (input: CreateRoleInput[], { container }) => {
    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
    const roles = await service.createRoles(input);

    return new StepResponse({ roles }, { roleIds: roles.map((r) => r.id) });
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

    if (compensation.roleIds) {
      await service.roles.delete(compensation.roleIds);
    }
  },
);
