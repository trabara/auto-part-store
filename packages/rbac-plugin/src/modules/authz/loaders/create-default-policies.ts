import { LoaderOptions } from "@medusajs/framework/types";
import { createRbacCategoriesWorkflow } from "../../../workflows";

export default async function createDefaultPolicies({
  container,
}: LoaderOptions) {
  createRbacCategoriesWorkflow(container).run({
    input: [
      {
        name: "Customers",
        description: "Manage customer information and profiles",
        perms: [
          { kind: "read", target: "/admin/customers", type: "predefined" },
          { kind: "write", target: "/admin/customers", type: "predefined" },
          { kind: "delete", target: "/admin/customers", type: "predefined" },
          { kind: "read", target: "/admin/customer-groups", type: "predefined" },
          { kind: "write", target: "/admin/customer-groups", type: "predefined" },
          { kind: "delete", target: "/admin/customer-groups", type: "predefined" },
        ]
      },
      {
        name: "Campaigns",
        description: "Manage marketing campaigns and promotions",
        perms: [
          { kind: "read", target: "/admin/campaigns", type: "predefined" },
          { kind: "write", target: "/admin/campaigns", type: "predefined" },
          { kind: "delete", target: "/admin/campaigns", type: "predefined" },

        ]
      },
      {
        name: 'Gift Cards',
        description: "Manage gift cards and their usage",
        perms: [
          { kind: "read", target: "/admin/gift-cards", type: "predefined" },
          { kind: "write", target: "/admin/gift-cards", type: "predefined" },
          { kind: "delete", target: "/admin/gift-cards", type: "predefined" },
        ]
      },
      {
        name: "Inventory",
        description: "Manage inventory levels and stock locations",
        perms: [
          { kind: "read", target: "/admin/inventory-items", type: "predefined" },
          { kind: "write", target: "/admin/inventory-items", type: "predefined" },
          { kind: "delete", target: "/admin/inventory-items", type: "predefined" },
          { kind: "read", target: "/admin/price-preferences", type: "predefined" },
          { kind: "write", target: "/admin/price-preferences", type: "predefined" },
          { kind: "delete", target: "/admin/price-preferences", type: "predefined" },
        ]
      },
      {
        name: "Promotions",
        description: "Manage discount codes and special offers",
        perms: [
          { kind: "read", target: "/admin/promotions", type: "predefined" },
          { kind: "write", target: "/admin/promotions", type: "predefined" },
          { kind: "delete", target: "/admin/promotions", type: "predefined" },
        ]
      },
      {
        name: 'Price Lists',
        description: "Manage price lists and customer-specific pricing",
        perms: [
          { kind: "read", target: "/admin/price-lists", type: "predefined" },
          { kind: "write", target: "/admin/price-lists", type: "predefined" },
          { kind: "delete", target: "/admin/price-lists", type: "predefined" },
        ]
      },
      {
        name: "Products",
        description: "Manage product listings and details",
        perms: [
          { kind: "read", target: "/admin/products", type: "predefined" },
          { kind: "write", target: "/admin/products", type: "predefined" },
          { kind: "delete", target: "/admin/products", type: "predefined" },
          { kind: 'read', target: "/admin/product-categories", type: "predefined" },
          { kind: 'write', target: "/admin/product-categories", type: "predefined" },
          { kind: 'delete', target: "/admin/product-categories", type: "predefined" },
          { kind: 'read', target: "/admin/product-types", type: "predefined" },
          { kind: 'write', target: "/admin/product-types", type: "predefined" },
          { kind: 'delete', target: "/admin/product-types", type: "predefined" },
          { kind: 'read', target: "/admin/product-tags", type: "predefined" },
          { kind: 'write', target: "/admin/product-tags", type: "predefined" },
          { kind: 'delete', target: "/admin/product-tags", type: "predefined" },
          { kind: 'read', target: "/admin/product-variants", type: "predefined" },
          { kind: 'write', target: "/admin/product-variants", type: "predefined" },
          { kind: 'delete', target: "/admin/product-variants", type: "predefined" },
          { kind: "read", target: "/admin/collections", type: "predefined" },
          { kind: "write", target: "/admin/collections", type: "predefined" },
          { kind: "delete", target: "/admin/collections", type: "predefined" },

        ]
      },
      {
        name: 'Users',
        description: "Manage user accounts and permissions",
        perms: [
          { kind: "read", target: "/admin/rbac/v2/roles", type: "predefined" },
          { kind: "write", target: "/admin/rbac/v2/roles", type: "predefined" },
          { kind: "delete", target: "/admin/rbac/v2/roles", type: "predefined" },
          { kind: "read", target: "/admin/rbac/v2/permissions", type: "predefined" },
          { kind: "write", target: "/admin/rbac/v2/permissions", type: "predefined" },
          { kind: "delete", target: "/admin/rbac/v2/permissions", type: "predefined" },
          { kind: "read", target: "/admin/rbac/v2/categories", type: "predefined" },
          { kind: "write", target: "/admin/rbac/v2/categories", type: "predefined" },
          { kind: "delete", target: "/admin/rbac/v2/categories", type: "predefined" },
          { kind: "read", target: "/admin/rbac/v2/members", type: "predefined" },
          { kind: "write", target: "/admin/rbac/v2/members", type: "predefined" },
          { kind: "delete", target: "/admin/rbac/v2/members", type: "predefined" },
          { kind: "read", target: "/admin/users", type: "predefined" },
          { kind: "write", target: "/admin/users", type: "predefined" },
          { kind: "delete", target: "/admin/users", type: "predefined" },
          { kind: "read", target: "/admin/invite", type: "predefined" },
          { kind: "write", target: "/admin/invite", type: "predefined" },
          { kind: "delete", target: "/admin/invite", type: "predefined" },
        ]
      },
      {
        name: "Settings",
        description: "Manage store settings and configurations",
        perms: [
          { kind: "read", target: "/admin/stores", type: "predefined" },
          { kind: "write", target: "/admin/stores", type: "predefined" },
          { kind: "delete", target: "/admin/stores", type: "predefined" },
          { kind: "read", target: "/admin/regions", type: "predefined" },
          { kind: "write", target: "/admin/regions", type: "predefined" },
          { kind: "delete", target: "/admin/regions", type: "predefined" },
          { kind: "read", target: "/admin/tax-regions", type: "predefined" },
          { kind: "write", target: "/admin/tax-regions", type: "predefined" },
          { kind: "delete", target: "/admin/tax-regions", type: "predefined" },
          { kind: "read", target: "/admin/return-reasons", type: "predefined" },
          { kind: "write", target: "/admin/return-reasons", type: "predefined" },
          { kind: "delete", target: "/admin/return-reasons", type: "predefined" },
          { kind: "read", target: '/admin/sales-channels', type: "predefined" },
          { kind: "write", target: '/admin/sales-channels', type: "predefined" },
          { kind: "delete", target: '/admin/sales-channels', type: "predefined" },
          { kind: "read", target: '/admin/shipping-profiles', type: "predefined" },
          { kind: "write", target: '/admin/shipping-profiles', type: "predefined" },
          { kind: "delete", target: '/admin/shipping-profiles', type: "predefined" },
          { kind: "read", target: '/admin/stock-locations', type: "predefined" },
          { kind: "write", target: '/admin/stock-locations', type: "predefined" },
          { kind: "delete", target: '/admin/stock-locations', type: "predefined" },
        ]
      },
      {
        name: "Orders",
        description: "Manage customer orders and transactions",
        perms: [
          { kind: "read", target: "/admin/orders", type: "predefined" },
          { kind: "write", target: "/admin/orders", type: "predefined" },
          { kind: "delete", target: "/admin/orders", type: "predefined" },
          { kind: "read", target: "/admin/draft-orders", type: "predefined" },
          { kind: "write", target: "/admin/draft-orders", type: "predefined" },
          { kind: "delete", target: "/admin/draft-orders", type: "predefined" },
        ]
      },
    ]
  })

} 