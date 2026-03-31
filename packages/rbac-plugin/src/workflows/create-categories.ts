import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse
} from "@medusajs/framework/workflows-sdk";
import { AUTHZ_MODULE, AuthzModuleService, CreateCategoryInput } from "../modules/authz";


const createRbacCategoriesStep = createStep(
  "create-rbac-categories-step",
  async (input: CreateCategoryInput[], { container }) => {

    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
    const categories = await service.createPermissionCategories(input);

    return new StepResponse({ categories }, { categoryIds: categories.map(c => c.id) });
  },
  async (compensation, { container }) => {
    if (!compensation) return;

    const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

    if (compensation.categoryIds) {
      await service.deletePermissionsByCategoryIds(compensation.categoryIds);
    }
  },
);

type CreateRbacCategoriesWorkflowInput = CreateCategoryInput[];

export const createRbacCategoriesWorkflow = createWorkflow(
  "create-rbac-categories-workflow",
  function (input: CreateRbacCategoriesWorkflowInput) {
    const { categories } = createRbacCategoriesStep(input);

    return new WorkflowResponse({
      categories
    });
  },
);
