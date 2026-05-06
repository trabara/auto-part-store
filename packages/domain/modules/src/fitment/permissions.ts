import type { CreateCategoryInput } from "@trabara/core/dtos";

export const FITMENT_PERMISSION_CATEGORIES: CreateCategoryInput[] = [
  {
    name: "Fitments",
    description:
      "Manage vehicle fitment data (makes, models, engines, fitments)",
    permissions: [
      { kind: "read", target: "/admin/makes", type: "predefined" },
      { kind: "write", target: "/admin/makes", type: "predefined" },
      { kind: "delete", target: "/admin/makes", type: "predefined" },
      { kind: "read", target: "/admin/models", type: "predefined" },
      { kind: "write", target: "/admin/models", type: "predefined" },
      { kind: "delete", target: "/admin/models", type: "predefined" },
      { kind: "read", target: "/admin/engines", type: "predefined" },
      { kind: "write", target: "/admin/engines", type: "predefined" },
      { kind: "delete", target: "/admin/engines", type: "predefined" },
      { kind: "read", target: "/admin/fitments", type: "predefined" },
      { kind: "write", target: "/admin/fitments", type: "predefined" },
      { kind: "delete", target: "/admin/fitments", type: "predefined" },
    ],
  },
];
