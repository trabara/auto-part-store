import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";
import { CreateCategoryInput } from "@trabara/core/dtos";

export const createRbacPermissionsStep = createStep(
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
