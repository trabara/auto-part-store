import { LoaderOptions } from "@medusajs/framework/types";
import type { CreateCategoryInput } from "@trabara/core/dtos";
import { AUTHZ_MODULE } from "../../authz/constant";
import type AuthzModuleService from "../../authz/services/authz-module.service";

const CATEGORIES: CreateCategoryInput[] = [
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

export default async function setupFitmentPermissionsLoader({
  container,
}: LoaderOptions) {
  const authzService = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

  // Idempotency — skip if already seeded
  const [existing] = await authzService.listAndCountAuthzCategories({
    name: ["Fitments"],
  });
  if (existing.length > 0) return;

  const categories = await authzService.createPermissionCategories(CATEGORIES);

  // Append all new permissions to the Admin role (best-effort)
  const [adminRoles] = await authzService.listAndCountAuthzRoles({
    name: ["Admin"],
  });
  if (!adminRoles.length) return;

  const permIds = categories.flatMap((c) =>
    c.permissions.map((p: any) => p.id),
  );

  await authzService.createAuthzPolicies(
    permIds.map((permission_id) => ({
      role_id: adminRoles[0].id,
      permission_id,
    })),
  );
}
