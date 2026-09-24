import type { CreateCategoryInput } from "@trabara/core/dtos";

export const ANALYTICS_PERMISSION_CATEGORIES: CreateCategoryInput[] = [
  {
    name: "Analytics",
    description: "View store analytics and reports",
    permissions: [
      {
        kind: "read",
        target: "/admin/agilo-analytics/orders",
        type: "predefined",
      },
      {
        kind: "read",
        target: "/admin/agilo-analytics/customers",
        type: "predefined",
      },
      {
        kind: "read",
        target: "/admin/agilo-analytics/products",
        type: "predefined",
      },
    ],
  },
];
