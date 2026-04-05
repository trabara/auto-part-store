import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { CreateRoleInput } from "@trabara/core/dtos";
import { createRbacRolesStep } from "./steps/create-roles";

type CreateRbacRolesWorkflowInput = CreateRoleInput[];

export const createRbacRolesWorkflow = createWorkflow(
  "create-rbac-roles-workflow",
  function (input: CreateRbacRolesWorkflowInput) {
    const { roles } = createRbacRolesStep(input);

    return new WorkflowResponse({
      roles,
    });
  },
);
