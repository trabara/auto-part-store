import type { CreateCategoryInput } from "@trabara/core/dtos";

export const MEDIA_PERMISSION_CATEGORIES: CreateCategoryInput[] = [
  {
    name: "Media",
    description: "Manage entity media assets (images)",
    permissions: [
      { kind: "read", target: "/admin/medias", type: "predefined" },
      { kind: "write", target: "/admin/medias", type: "predefined" },
      { kind: "delete", target: "/admin/medias", type: "predefined" },
    ],
  },
];
