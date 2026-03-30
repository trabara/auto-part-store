import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { RBAC_V2_MODULE, RbacV2ModuleService } from "../modules/rbac";
import { DEFAULT_CATEGORIES, PREDEFINED_PERMISSIONS } from "../modules/rbac/constant";


const seedRbacStep = createStep(
  "seed-rbac-step",
  async (_, { container }) => {
    const service = container.resolve<RbacV2ModuleService>(RBAC_V2_MODULE);

    const [existingCategories] = await service.listAndCountRbacV2Categories({});
    if (existingCategories.length > 0) {
      return new StepResponse({ seeded: false }, null);
    }

    const categoryMap = new Map<string, string>();
    for (const cat of DEFAULT_CATEGORIES) {
      const created = await service.createRbacV2Categories(cat);
      categoryMap.set(cat.name, created.id);
    }

    const permissions: string[] = [];
    for (const perm of PREDEFINED_PERMISSIONS) {
      const categoryId = categoryMap.get(perm.category) || null;
      const created = await service.createRbacV2Permissions({
        kind: perm.kind as "read" | "write" | "delete",
        target: perm.target,
        type: "predefined",
        category_id: categoryId,
      });
      permissions.push(created.id);
    }

    return new StepResponse(
      {
        seeded: true,
        categoryCount: categoryMap.size,
        permissionCount: permissions.length,
      },
      {
        categoryIds: Array.from(categoryMap.values()),
        permissionIds: permissions,
      },
    );
  },
  async (compensation, { container }) => {
    if (!compensation || !compensation.permissionIds) return;

    const service = container.resolve<RbacV2ModuleService>(RBAC_V2_MODULE);

    if (compensation.permissionIds?.length) {
      await service.deleteRbacV2Permissions(compensation.permissionIds);
    }
    if (compensation.categoryIds?.length) {
      await service.deleteRbacV2Categories(compensation.categoryIds);
    }
  },
);

export const seedRbacWorkflow = createWorkflow("seed-rbac", function () {
  const result = seedRbacStep();
  return new WorkflowResponse(result);
});
