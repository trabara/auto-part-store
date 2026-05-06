import type { CreateCategoryInput } from "@trabara/core/dtos";

export const OAUTH_PERMISSION_CATEGORIES: CreateCategoryInput[] = [
  {
    name: "OAuth Providers",
    description: "Manage OAuth provider configurations",
    permissions: [
      { kind: "read", target: "/admin/oauth-providers", type: "predefined" },
      { kind: "write", target: "/admin/oauth-providers", type: "predefined" },
      { kind: "delete", target: "/admin/oauth-providers", type: "predefined" },
    ],
  },
];
