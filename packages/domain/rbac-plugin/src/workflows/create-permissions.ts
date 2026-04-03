import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { AUTHZ_MODULE, AuthzModuleService } from "../modules/authz";
import { CreateCategoryInput } from "@trabara/core/dtos";

const createRbacPermissionsStep = createStep(
  "create-rbac-permissions-step",
  async (input: CreateCategoryInput[], { container }) => {
    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
    const categories = await service.createPermissionCategories(input);

    return new StepResponse(
      { categories },
      { categoryIds: categories.map((c) => c.id) },
    );
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

    if (compensation.categoryIds) {
      await service.deletePermissionsByCategoryIds(compensation.categoryIds);
    }
  },
);

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
