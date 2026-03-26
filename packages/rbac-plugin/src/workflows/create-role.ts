import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { RBAC_MODULE, RbacModuleService } from "../modules/rbac";

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
    const service = container.resolve<RbacModuleService>(RBAC_MODULE);

    const policies = await service.createRbacPolicies(
      input.policies
    );

    const role = await service.createRbacRoles({
      name: input.name,
      description: input.description,
      is_default: input.is_default,
      policies: policies.map((p) => p.id),
    });

    return new StepResponse(
      { role },
      { roleId: role.id, policyIds: policies.map((p: any) => p.id) },
    );
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<RbacModuleService>(RBAC_MODULE);

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
