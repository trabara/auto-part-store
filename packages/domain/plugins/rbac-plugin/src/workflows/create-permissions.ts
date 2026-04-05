import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { CreateCategoryInput } from "@trabara/core/dtos";
import { createRbacPermissionsStep } from "./steps/create-permissions";

type CreateRbacPermissionsWorkflowInput = CreateCategoryInput[];

export const createRbacPermissionsWorkflow = createWorkflow(
  "create-rbac-permissions-workflow",
  function (input: CreateRbacPermissionsWorkflowInput) {
    const { categories } = createRbacPermissionsStep(input);

    return new WorkflowResponse({
      categories,
    });
  },
);
