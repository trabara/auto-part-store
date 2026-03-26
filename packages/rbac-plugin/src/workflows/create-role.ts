import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { RBAC_MODULE } from "../modules/rbac";

type PolicyInput = {
  permission_id: string;
  name: "ALLOW" | "DENY";
};

type CreateRoleWorkflowInput = {
  name: string;
  description?: string;
  is_default?: boolean;
  policies: PolicyInput[];
};

const createRoleStep = createStep(
  "create-role-step",
  async (input: CreateRoleWorkflowInput, { container }) => {
    const service = container.resolve<any>(RBAC_MODULE);

    const role = await service.createRbacRoles({
      name: input.name,
      description: input.description,
      is_default: input.is_default,
    });

    const policies = await service.createRbacPolicies(
      input.policies.map((p) => ({
        ...p,
        role_id: role.id,
      })),
    );

    return new StepResponse(
      { role, policies },
      { roleId: role.id, policyIds: policies.map((p: any) => p.id) },
    );
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<any>(RBAC_MODULE);

    if (compensation.policyIds?.length) {
      await service.deleteRbacPolicies(compensation.policyIds);
    }
    if (compensation.roleId) {
      await service.deleteRbacRoles([compensation.roleId]);
    }
  },
);

export const createRoleWorkflow = createWorkflow(
  "create-role",
  function (input: CreateRoleWorkflowInput) {
    const result = createRoleStep(input);
    return new WorkflowResponse(result);
  },
);
