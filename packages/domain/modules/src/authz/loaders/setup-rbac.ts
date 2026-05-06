import { LoaderOptions } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { CreateCategoryInput, CreateRoleInput } from "@trabara/core/dtos";
import { ANALYTICS_PERMISSION_CATEGORIES } from "../../analytics/permissions";
import { FITMENT_PERMISSION_CATEGORIES } from "../../fitment/permissions";
import { INVOICE_PERMISSION_CATEGORIES } from "../../invoice-generator/permissions";
import { MEDIA_PERMISSION_CATEGORIES } from "../../media/permissions";
import { OAUTH_PERMISSION_CATEGORIES } from "../../oauth/permissions";
import type AuthzModuleService from "../services/authz-module.service";

// ─── Core Medusa permission categories ───────────────────────────────────────

const CORE_CATEGORIES: CreateCategoryInput[] = [
  {
    name: "Development",
    description: "Permissions for development and testing purposes",
    permissions: [
      { kind: "read", target: "/admin/api-keys", type: "predefined" },
      { kind: "write", target: "/admin/api-keys", type: "predefined" },
      { kind: "delete", target: "/admin/api-keys", type: "predefined" },
      {
        kind: "read",
        target: "/admin/workflows-executions",
        type: "predefined",
      },
      {
        kind: "write",
        target: "/admin/workflows-executions",
        type: "predefined",
      },
      {
        kind: "delete",
        target: "/admin/workflows-executions",
        type: "predefined",
      },
    ],
  },
  {
    name: "Customers",
    description: "Manage customer information and profiles",
    permissions: [
      { kind: "read", target: "/admin/customers", type: "predefined" },
      { kind: "write", target: "/admin/customers", type: "predefined" },
      { kind: "delete", target: "/admin/customers", type: "predefined" },
      { kind: "read", target: "/admin/customer-groups", type: "predefined" },
      { kind: "write", target: "/admin/customer-groups", type: "predefined" },
      { kind: "delete", target: "/admin/customer-groups", type: "predefined" },
    ],
  },
  {
    name: "Campaigns",
    description: "Manage marketing campaigns and promotions",
    permissions: [
      { kind: "read", target: "/admin/campaigns", type: "predefined" },
      { kind: "write", target: "/admin/campaigns", type: "predefined" },
      { kind: "delete", target: "/admin/campaigns", type: "predefined" },
    ],
  },
  {
    name: "Gift Cards",
    description: "Manage gift cards and their usage",
    permissions: [
      { kind: "read", target: "/admin/gift-cards", type: "predefined" },
      { kind: "write", target: "/admin/gift-cards", type: "predefined" },
      { kind: "delete", target: "/admin/gift-cards", type: "predefined" },
    ],
  },
  {
    name: "Inventory",
    description: "Manage inventory levels and stock locations",
    permissions: [
      { kind: "read", target: "/admin/inventory-items", type: "predefined" },
      { kind: "write", target: "/admin/inventory-items", type: "predefined" },
      { kind: "delete", target: "/admin/inventory-items", type: "predefined" },
      { kind: "read", target: "/admin/price-preferences", type: "predefined" },
      { kind: "write", target: "/admin/price-preferences", type: "predefined" },
      {
        kind: "delete",
        target: "/admin/price-preferences",
        type: "predefined",
      },
      { kind: "read", target: "/admin/reservations", type: "predefined" },
      { kind: "write", target: "/admin/reservations", type: "predefined" },
      { kind: "delete", target: "/admin/reservations", type: "predefined" },
    ],
  },
  {
    name: "Promotions",
    description: "Manage discount codes and special offers",
    permissions: [
      { kind: "read", target: "/admin/promotions", type: "predefined" },
      { kind: "write", target: "/admin/promotions", type: "predefined" },
      { kind: "delete", target: "/admin/promotions", type: "predefined" },
    ],
  },
  {
    name: "Price Lists",
    description: "Manage price lists and customer-specific pricing",
    permissions: [
      { kind: "read", target: "/admin/price-lists", type: "predefined" },
      { kind: "write", target: "/admin/price-lists", type: "predefined" },
      { kind: "delete", target: "/admin/price-lists", type: "predefined" },
    ],
  },
  {
    name: "Products",
    description: "Manage product listings and details",
    permissions: [
      { kind: "read", target: "/admin/products", type: "predefined" },
      { kind: "write", target: "/admin/products", type: "predefined" },
      { kind: "delete", target: "/admin/products", type: "predefined" },
      { kind: "read", target: "/admin/product-categories", type: "predefined" },
      {
        kind: "write",
        target: "/admin/product-categories",
        type: "predefined",
      },
      {
        kind: "delete",
        target: "/admin/product-categories",
        type: "predefined",
      },
      { kind: "read", target: "/admin/product-types", type: "predefined" },
      { kind: "write", target: "/admin/product-types", type: "predefined" },
      { kind: "delete", target: "/admin/product-types", type: "predefined" },
      { kind: "read", target: "/admin/product-tags", type: "predefined" },
      { kind: "write", target: "/admin/product-tags", type: "predefined" },
      { kind: "delete", target: "/admin/product-tags", type: "predefined" },
      { kind: "read", target: "/admin/product-variants", type: "predefined" },
      { kind: "write", target: "/admin/product-variants", type: "predefined" },
      { kind: "delete", target: "/admin/product-variants", type: "predefined" },
      { kind: "read", target: "/admin/collections", type: "predefined" },
      { kind: "write", target: "/admin/collections", type: "predefined" },
      { kind: "delete", target: "/admin/collections", type: "predefined" },
    ],
  },
  {
    name: "Users",
    description: "Manage user accounts and permissions",
    permissions: [
      { kind: "read", target: "/admin/rbac/v2/roles", type: "predefined" },
      { kind: "write", target: "/admin/rbac/v2/roles", type: "predefined" },
      { kind: "delete", target: "/admin/rbac/v2/roles", type: "predefined" },
      {
        kind: "read",
        target: "/admin/rbac/v2/permissions",
        type: "predefined",
      },
      {
        kind: "write",
        target: "/admin/rbac/v2/permissions",
        type: "predefined",
      },
      {
        kind: "delete",
        target: "/admin/rbac/v2/permissions",
        type: "predefined",
      },
      { kind: "read", target: "/admin/rbac/v2/categories", type: "predefined" },
      {
        kind: "write",
        target: "/admin/rbac/v2/categories",
        type: "predefined",
      },
      {
        kind: "delete",
        target: "/admin/rbac/v2/categories",
        type: "predefined",
      },
      { kind: "read", target: "/admin/rbac/v2/members", type: "predefined" },
      { kind: "write", target: "/admin/rbac/v2/members", type: "predefined" },
      { kind: "delete", target: "/admin/rbac/v2/members", type: "predefined" },
      { kind: "read", target: "/admin/rbac/v2/stats", type: "predefined" },
      { kind: "read", target: "/admin/users", type: "predefined" },
      { kind: "write", target: "/admin/users", type: "predefined" },
      { kind: "delete", target: "/admin/users", type: "predefined" },
      { kind: "read", target: "/admin/invite", type: "predefined" },
      { kind: "write", target: "/admin/invite", type: "predefined" },
      { kind: "delete", target: "/admin/invite", type: "predefined" },
    ],
  },
  {
    name: "Settings",
    description: "Manage store settings and configurations",
    permissions: [
      { kind: "read", target: "/admin/stores", type: "predefined" },
      { kind: "write", target: "/admin/stores", type: "predefined" },
      { kind: "delete", target: "/admin/stores", type: "predefined" },
      { kind: "read", target: "/admin/uploads", type: "predefined" },
      { kind: "write", target: "/admin/uploads", type: "predefined" },
      { kind: "delete", target: "/admin/uploads", type: "predefined" },
      { kind: "read", target: "/admin/regions", type: "predefined" },
      { kind: "write", target: "/admin/regions", type: "predefined" },
      { kind: "delete", target: "/admin/regions", type: "predefined" },
      { kind: "read", target: "/admin/tax-regions", type: "predefined" },
      { kind: "write", target: "/admin/tax-regions", type: "predefined" },
      { kind: "delete", target: "/admin/tax-regions", type: "predefined" },
      { kind: "read", target: "/admin/tax-rates", type: "predefined" },
      { kind: "write", target: "/admin/tax-rates", type: "predefined" },
      { kind: "delete", target: "/admin/tax-rates", type: "predefined" },
      { kind: "read", target: "/admin/return-reasons", type: "predefined" },
      { kind: "write", target: "/admin/return-reasons", type: "predefined" },
      { kind: "delete", target: "/admin/return-reasons", type: "predefined" },
      { kind: "read", target: "/admin/sales-channels", type: "predefined" },
      { kind: "write", target: "/admin/sales-channels", type: "predefined" },
      { kind: "delete", target: "/admin/sales-channels", type: "predefined" },
      { kind: "read", target: "/admin/shipping-profiles", type: "predefined" },
      { kind: "write", target: "/admin/shipping-profiles", type: "predefined" },
      {
        kind: "delete",
        target: "/admin/shipping-profiles",
        type: "predefined",
      },
      { kind: "read", target: "/admin/shipping-options", type: "predefined" },
      { kind: "write", target: "/admin/shipping-options", type: "predefined" },
      { kind: "delete", target: "/admin/shipping-options", type: "predefined" },
      {
        kind: "read",
        target: "/admin/shipping-option-types",
        type: "predefined",
      },
      {
        kind: "write",
        target: "/admin/shipping-option-types",
        type: "predefined",
      },
      {
        kind: "delete",
        target: "/admin/shipping-option-types",
        type: "predefined",
      },
      {
        kind: "read",
        target: "/admin/fulfillment-providers",
        type: "predefined",
      },
      {
        kind: "write",
        target: "/admin/fulfillment-providers",
        type: "predefined",
      },
      {
        kind: "delete",
        target: "/admin/fulfillment-providers",
        type: "predefined",
      },
      { kind: "read", target: "/admin/stock-locations", type: "predefined" },
      { kind: "write", target: "/admin/stock-locations", type: "predefined" },
      { kind: "delete", target: "/admin/stock-locations", type: "predefined" },
      { kind: "read", target: "/admin/currencies", type: "predefined" },
      { kind: "write", target: "/admin/currencies", type: "predefined" },
      { kind: "delete", target: "/admin/currencies", type: "predefined" },
      { kind: "read", target: "/admin/refund-reasons", type: "predefined" },
      { kind: "write", target: "/admin/refund-reasons", type: "predefined" },
      { kind: "delete", target: "/admin/refund-reasons", type: "predefined" },
      {
        kind: "read",
        target: "/admin/translations/settings",
        type: "predefined",
      },
      {
        kind: "write",
        target: "/admin/translations/settings",
        type: "predefined",
      },
      {
        kind: "delete",
        target: "/admin/translations/settings",
        type: "predefined",
      },
      {
        kind: "read",
        target: "/admin/translations/statistics",
        type: "predefined",
      },
      {
        kind: "write",
        target: "/admin/translations/statistics",
        type: "predefined",
      },
      {
        kind: "delete",
        target: "/admin/translations/statistics",
        type: "predefined",
      },
      {
        kind: "read",
        target: "/admin/translations/entities",
        type: "predefined",
      },
      {
        kind: "write",
        target: "/admin/translations/entities",
        type: "predefined",
      },
      {
        kind: "delete",
        target: "/admin/translations/entities",
        type: "predefined",
      },
      { kind: "read", target: "/admin/translations/batch", type: "predefined" },
      {
        kind: "write",
        target: "/admin/translations/batch",
        type: "predefined",
      },
      {
        kind: "delete",
        target: "/admin/translations/batch",
        type: "predefined",
      },
      { kind: "read", target: "/admin/locales", type: "predefined" },
      { kind: "write", target: "/admin/locales", type: "predefined" },
      { kind: "delete", target: "/admin/locales", type: "predefined" },
    ],
  },
  {
    name: "Orders",
    description: "Manage customer orders and transactions",
    permissions: [
      { kind: "read", target: "/admin/orders", type: "predefined" },
      { kind: "write", target: "/admin/orders", type: "predefined" },
      { kind: "delete", target: "/admin/orders", type: "predefined" },
      { kind: "read", target: "/admin/draft-orders", type: "predefined" },
      { kind: "write", target: "/admin/draft-orders", type: "predefined" },
      { kind: "delete", target: "/admin/draft-orders", type: "predefined" },
    ],
  },
];

// ─── All categories (core + plugin-owned) ────────────────────────────────────

const ALL_CATEGORIES: CreateCategoryInput[] = [
  ...CORE_CATEGORIES,
  ...FITMENT_PERMISSION_CATEGORIES,
  ...INVOICE_PERMISSION_CATEGORIES,
  ...MEDIA_PERMISSION_CATEGORIES,
  ...OAUTH_PERMISSION_CATEGORIES,
  ...ANALYTICS_PERMISSION_CATEGORIES,
];

// ─── Role definitions ─────────────────────────────────────────────────────────

const ROLE_DEFINITIONS = [
  {
    name: "Customer Support",
    description:
      "Role for customer support representatives with permissions to manage customers and orders.",
    categoryNames: ["Customers", "Orders"],
  },
  {
    name: "Developer",
    description:
      "Role for developers with permissions to manage API keys and workflow executions.",
    categoryNames: ["Development"],
  },
  {
    name: "Marketing Manager",
    description:
      "Role for marketing managers with permissions to manage campaigns, promotions, gift cards, and analytics.",
    categoryNames: ["Campaigns", "Promotions", "Gift Cards", "Analytics"],
  },
  {
    name: "Inventory Manager",
    description:
      "Role for inventory managers with permissions to manage inventory items and stock locations.",
    categoryNames: ["Inventory"],
  },
  {
    name: "Product Manager",
    description:
      "Role for product managers with permissions to manage products, categories, and collections.",
    categoryNames: ["Products", "Fitments"],
  },
  {
    name: "Admin",
    description:
      "Role for administrators with full access to all aspects of the store.",
    categoryNames: null, // null = all categories
  },
];

// ─── Loader ───────────────────────────────────────────────────────────────────

export default async function setupRbacLoader({ container }: LoaderOptions) {
  // The authz service is registered in localContainer by its camelCase class name
  const service = container.resolve<AuthzModuleService>("authzModuleService");

  // ── 1. Seed categories + permissions (idempotent) ─────────────────────────
  const [existingCount] = await service.listAndCountAuthzCategories();
  if (existingCount.length > 0) {
    // Already seeded — nothing to do.
    return;
  }

  const categories = await service.createPermissionCategories(ALL_CATEGORIES);

  // Build a name → permission-id[] map for role construction.
  const categoryMap = new Map(
    categories.map((c) => [c.name, c.permissions.map((p: any) => p.id)]),
  );

  // ── 2. Seed roles ─────────────────────────────────────────────────────────
  const roleInputs: CreateRoleInput[] = ROLE_DEFINITIONS.map((def) => ({
    name: def.name,
    description: def.description,
    permissions:
      def.categoryNames === null
        ? categories.flatMap((c) => c.permissions.map((p: any) => p.id))
        : def.categoryNames.flatMap((name) => categoryMap.get(name) ?? []),
  }));

  const roles = await service.createRolesWithPermissions(roleInputs);

  // ── 3. Assign the Admin role to the first user (if one exists) ────────────
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: users } = await query.graph({
    entity: "user",
    fields: ["id"],
  });

  if (!users.length) return;

  const adminRole = roles.find((r) => r.name === "Admin");
  if (!adminRole) return;

  const firstUser = users[0];

  const existingMembers = await service.listAuthzMembers({
    user_id: firstUser.id,
  });
  if (existingMembers.length > 0) return;

  await service.assignRbacUsers(adminRole.id, { userIds: [firstUser.id] });
}
