import { defineRouteConfig } from "@medusajs/admin-sdk";

export default function RbacStatsPage() {}

export const handle = {
  breadcrumb: () => "RBAC",
};

export const config = defineRouteConfig({
  label: "nav.rbac",
  translationNs: "translation",
});
