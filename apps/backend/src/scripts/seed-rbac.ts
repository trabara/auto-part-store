import { ExecArgs } from "@medusajs/framework/types";
import { createRbacPermissionsWorkflow, createRbacRolesWorkflow, assignRoleWorkflow } from "@repo/rbac-plugin/workflows";

export default async function seedRbac({ container }: ExecArgs) {

    const { result: { categories } } = await createRbacPermissionsWorkflow(container)
        .run({
            input: [
                {
                    name: "Development",
                    description: "Permissions for development and testing purposes",
                    permissions: [
                        { kind: "read", target: "/admin/api-keys", type: "predefined" },
                        { kind: "write", target: "/admin/api-keys", type: "predefined" },
                        { kind: "delete", target: "/admin/api-keys", type: "predefined" },
                        { kind: "read", target: "/admin/workflows-executions", type: "predefined" },
                        { kind: "write", target: "/admin/workflows-executions", type: "predefined" },
                        { kind: "delete", target: "/admin/workflows-executions", type: "predefined" },
                    ]

                },
                {
                    name: "Analytics",
                    description: "View store analytics and reports",
                    permissions: [
                        { kind: "read", target: "/admin/agilo-analytics/orders", type: "predefined" },
                        { kind: "read", target: "/admin/agilo-analytics/customers", type: "predefined" },
                        { kind: "read", target: "/admin/agilo-analytics/products", type: "predefined" },
                    ]
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
                    ]
                },
                {
                    name: "Campaigns",
                    description: "Manage marketing campaigns and promotions",
                    permissions: [
                        { kind: "read", target: "/admin/campaigns", type: "predefined" },
                        { kind: "write", target: "/admin/campaigns", type: "predefined" },
                        { kind: "delete", target: "/admin/campaigns", type: "predefined" },
                    ]
                },
                {
                    name: 'Gift Cards',
                    description: "Manage gift cards and their usage",
                    permissions: [
                        { kind: "read", target: "/admin/gift-cards", type: "predefined" },
                        { kind: "write", target: "/admin/gift-cards", type: "predefined" },
                        { kind: "delete", target: "/admin/gift-cards", type: "predefined" },
                    ]
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
                        { kind: "delete", target: "/admin/price-preferences", type: "predefined" },
                        { kind: 'read', target: "/admin/reservations", type: "predefined" },
                        { kind: 'write', target: "/admin/reservations", type: "predefined" },
                        { kind: 'delete', target: "/admin/reservations", type: "predefined" },
                    ]
                },
                {
                    name: "Promotions",
                    description: "Manage discount codes and special offers",
                    permissions: [
                        { kind: "read", target: "/admin/promotions", type: "predefined" },
                        { kind: "write", target: "/admin/promotions", type: "predefined" },
                        { kind: "delete", target: "/admin/promotions", type: "predefined" },
                    ]
                },
                {
                    name: 'Price Lists',
                    description: "Manage price lists and customer-specific pricing",
                    permissions: [
                        { kind: "read", target: "/admin/price-lists", type: "predefined" },
                        { kind: "write", target: "/admin/price-lists", type: "predefined" },
                        { kind: "delete", target: "/admin/price-lists", type: "predefined" },
                    ]
                },
                {
                    name: "Products",
                    description: "Manage product listings and details",
                    permissions: [
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
                    permissions: [
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
                    permissions: [
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
                        { kind: "read", target: '/admin/shipping-options', type: "predefined" },
                        { kind: "write", target: '/admin/shipping-options', type: "predefined" },
                        { kind: "delete", target: '/admin/shipping-options', type: "predefined" },
                        { kind: "read", target: '/admin/shipping-option-types', type: "predefined" },
                        { kind: "write", target: '/admin/shipping-option-types', type: "predefined" },
                        { kind: "delete", target: '/admin/shipping-option-types', type: "predefined" },
                        { kind: "read", target: '/admin/fulfillment-providers', type: "predefined" },
                        { kind: "write", target: '/admin/fulfillment-providers', type: "predefined" },
                        { kind: "delete", target: '/admin/fulfillment-providers', type: "predefined" },
                        { kind: "read", target: '/admin/stock-locations', type: "predefined" },
                        { kind: "write", target: '/admin/stock-locations', type: "predefined" },
                        { kind: "delete", target: '/admin/stock-locations', type: "predefined" },
                        { kind: "read", target: '/admin/currencies', type: "predefined" },
                        { kind: "write", target: '/admin/currencies', type: "predefined" },
                        { kind: "delete", target: '/admin/currencies', type: "predefined" },
                        { kind: "read", target: '/admin/refund-reasons', type: "predefined" },
                        { kind: "write", target: '/admin/refund-reasons', type: "predefined" },
                        { kind: "delete", target: '/admin/refund-reasons', type: "predefined" },
                        { kind: "read", target: '/admin/invoice-config', type: "predefined" },
                        { kind: "write", target: '/admin/invoice-config', type: "predefined" },
                        { kind: "delete", target: '/admin/invoice-config', type: "predefined" },
                        { kind: "read", target: '/admin/translations/settings', type: "predefined" },
                        { kind: "write", target: '/admin/translations/settings', type: "predefined" },
                        { kind: "delete", target: '/admin/translations/settings', type: "predefined" },
                        { kind: "read", target: '/admin/translations/statistics', type: "predefined" },
                        { kind: "write", target: '/admin/translations/statistics', type: "predefined" },
                        { kind: "delete", target: '/admin/translations/statistics', type: "predefined" },
                        { kind: "read", target: '/admin/translations/entities', type: "predefined" },
                        { kind: "write", target: '/admin/translations/entities', type: "predefined" },
                        { kind: "delete", target: '/admin/translations/entities', type: "predefined" },
                        { kind: "read", target: '/admin/translations/batch', type: "predefined" },
                        { kind: "write", target: '/admin/translations/batch', type: "predefined" },
                        { kind: "delete", target: '/admin/translations/batch', type: "predefined" },
                        { kind: "read", target: '/admin/locales', type: "predefined" },
                        { kind: "write", target: '/admin/locales', type: "predefined" },
                        { kind: "delete", target: '/admin/locales', type: "predefined" },
                        { kind: "read", target: '/admin/makes', type: "predefined" },
                        { kind: "write", target: '/admin/makes', type: "predefined" },
                        { kind: "delete", target: '/admin/makes', type: "predefined" },
                        { kind: "read", target: '/admin/models', type: "predefined" },
                        { kind: "write", target: '/admin/models', type: "predefined" },
                        { kind: "delete", target: '/admin/models', type: "predefined" },
                        { kind: "read", target: '/admin/engines', type: "predefined" },
                        { kind: "write", target: '/admin/engines', type: "predefined" },
                        { kind: "delete", target: '/admin/engines', type: "predefined" },
                        { kind: "read", target: '/admin/fitments', type: "predefined" },
                        { kind: "write", target: '/admin/fitments', type: "predefined" },
                        { kind: "delete", target: '/admin/fitments', type: "predefined" },
                    ]
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
                    ]
                },
            ]
        })


    const { result: { roles } } = await createRbacRolesWorkflow(container)
        .run({
            input: [
                {
                    name: "Customer Support",
                    description: "Role for customer support representatives with permissions to manage customers and orders.",
                    permissions: categories
                        .filter((c) => ["Customers", "Orders"].includes(c.name))
                        .flatMap((c) => c.permissions.map((p) => p.id)),
                },
                {
                    name: "Developer",
                    description: "Role for developers with permissions to manage API keys and workflows executions.",
                    permissions: categories
                        .filter((c) => ["Development"].includes(c.name))
                        .flatMap((c) => c.permissions.map((p) => p.id)),
                },
                {
                    name: "Marketing Manager",
                    description: "Role for marketing managers with permissions to manage campaigns, promotions, gift cards, and analytics.",
                    permissions: categories
                        .filter((c) => ["Campaigns", "Promotions", "Gift Cards", "Analytics"].includes(c.name))
                        .flatMap((c) => c.permissions.map((p) => p.id)),
                },
                {
                    name: "Inventory Manager",
                    description: "Role for inventory managers with permissions to manage inventory items and stock locations.",
                    permissions: categories
                        .filter((c) => ["Inventory"].includes(c.name))
                        .flatMap((c) => c.permissions.map((p) => p.id)),
                },
                {
                    name: "Product Manager",
                    description: "Role for product managers with permissions to manage products, categories, and collections.",
                    permissions: categories
                        .filter((c) => ["Products"].includes(c.name))
                        .flatMap((c) => c.permissions.map((p) => p.id)),
                },
                {
                    name: "Admin",
                    description: "Role for administrators with permissions to manage all aspects of the store.",
                    permissions: categories.flatMap((c) => c.permissions.map((p) => p.id)),
                },
            ]
        });

    const query = container.resolve('query')

    const { data: [user] } = await query.graph({
        entity: "user",
        fields: ["id"]
    })

    const adminRole = roles.find((r) => r.name === "Admin")
    if (!adminRole) {
        throw new Error("Admin role not found")
    }

    await assignRoleWorkflow(container).run({
        input: {
            userId: user.id,
            roleId: adminRole.id,
        }
    })
}