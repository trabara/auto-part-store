import { IMedusaInternalService, LoaderOptions } from "@medusajs/framework/types";
import { CategoryEntity, PermEntity } from "../models";

interface RbacPluginOptions {
  seed?: boolean;
}

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

export default async function createRbacLoader({
  container,
  options,
}: LoaderOptions & { options: RbacPluginOptions }): Promise<void> {
  if (options.seed === false) {
    return;
  }

  const categoryService: IMedusaInternalService<
    typeof CategoryEntity
  > = container.resolve('rbacCategoryService');

  const [existingCategories] = await categoryService.listAndCount({});
  if (existingCategories.length > 0) {
    return;
  }

  const categoryMap = new Map<string, string>();
  for (const cat of DEFAULT_CATEGORIES) {
    const created = await categoryService.create(cat);
    categoryMap.set(cat.name, created.id);
  }

  const permissionService: IMedusaInternalService<
    typeof PermEntity
  > = container.resolve('rbacPermissionService');

  for (const perm of PREDEFINED_PERMISSIONS) {
    const categoryId = categoryMap.get(perm.category) || null;
    await permissionService.create({
      kind: perm.kind as "read" | "write" | "delete",
      target: perm.target,
      type: "predefined",
      category_id: categoryId,
    });
  }
}
