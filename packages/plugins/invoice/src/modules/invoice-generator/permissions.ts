import type { CreateCategoryInput } from "@trabara/core/dtos";

export const INVOICE_PERMISSION_CATEGORIES: CreateCategoryInput[] = [
  {
    name: "Invoices",
    description: "Manage invoice configuration and order invoices",
    permissions: [
      { kind: "read", target: "/admin/invoice-config", type: "predefined" },
      { kind: "write", target: "/admin/invoice-config", type: "predefined" },
      { kind: "delete", target: "/admin/invoice-config", type: "predefined" },
      {
        kind: "read",
        target: "/admin/orders/:id/invoices",
        type: "predefined",
      },
    ],
  },
];
