import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { RBAC_MODULE, RbacModuleService } from "../modules/rbac";

const DEFAULT_CATEGORIES = [
  { name: "Products", description: "Manage products and inventory" },
  { name: "Orders", description: "Manage orders and fulfillment" },
  { name: "Customers", description: "Manage customers" },
  { name: "Users", description: "Manage admin users" },
  { name: "Invites", description: "Manage admin invites" },
  { name: "Settings", description: "Manage store settings" },
  { name: "Price Lists", description: "Manage price lists" },
  { name: "Promotions", description: "Manage promotions and discounts" },
  { name: "Gift Cards", description: "Manage gift cards" },
];

const PREDEFINED_PERMISSIONS = [
  { kind: "read", target: "/admin/products", category: "Products" },
  { kind: "write", target: "/admin/products", category: "Products" },
  { kind: "delete", target: "/admin/products", category: "Products" },
  { kind: "read", target: "/admin/orders", category: "Orders" },
  { kind: "write", target: "/admin/orders", category: "Orders" },
  { kind: "delete", target: "/admin/orders", category: "Orders" },
  { kind: "read", target: "/admin/customers", category: "Customers" },
  { kind: "write", target: "/admin/customers", category: "Customers" },
  { kind: "delete", target: "/admin/customers", category: "Customers" },
  { kind: "read", target: "/admin/users", category: "Users" },
  { kind: "write", target: "/admin/users", category: "Users" },
  { kind: "delete", target: "/admin/users", category: "Users" },
  { kind: "read", target: "/admin/invite", category: "Invites" },
  { kind: "write", target: "/admin/invite", category: "Invites" },
  { kind: "read", target: "/admin/store", category: "Settings" },
  { kind: "write", target: "/admin/store", category: "Settings" },
  { kind: "read", target: "/admin/price-lists", category: "Price Lists" },
  { kind: "write", target: "/admin/price-lists", category: "Price Lists" },
  { kind: "delete", target: "/admin/price-lists", category: "Price Lists" },
  { kind: "read", target: "/admin/promotions", category: "Promotions" },
  { kind: "write", target: "/admin/promotions", category: "Promotions" },
  { kind: "delete", target: "/admin/promotions", category: "Promotions" },
  { kind: "read", target: "/admin/gift-cards", category: "Gift Cards" },
  { kind: "write", target: "/admin/gift-cards", category: "Gift Cards" },
  { kind: "delete", target: "/admin/gift-cards", category: "Gift Cards" },
];

const seedRbacStep = createStep(
  "seed-rbac-step",
  async (_, { container }) => {
    const service = container.resolve<RbacModuleService>(RBAC_MODULE);

    const [existingCategories] = await service.listAndCountCategoryEntities({});
    if (existingCategories.length > 0) {
      return new StepResponse({ seeded: false }, null);
    }

    const categoryMap = new Map<string, string>();
    for (const cat of DEFAULT_CATEGORIES) {
      const created = await service.createCategoryEntities(cat);
      categoryMap.set(cat.name, created.id);
    }

    const permissions: string[] = [];
    for (const perm of PREDEFINED_PERMISSIONS) {
      const categoryId = categoryMap.get(perm.category) || null;
      const created = await service.createPermEntities({
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

    const service = container.resolve<RbacModuleService>(RBAC_MODULE);

    if (compensation.permissionIds?.length) {
      await service.deletePermEntities(compensation.permissionIds);
    }
    if (compensation.categoryIds?.length) {
      await service.deleteCategoryEntities(compensation.categoryIds);
    }
  },
);

export const seedRbacWorkflow = createWorkflow("seed-rbac", function () {
  const result = seedRbacStep();
  return new WorkflowResponse(result);
});
