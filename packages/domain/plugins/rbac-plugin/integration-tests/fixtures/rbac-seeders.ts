import { AuthzModuleService, AUTHZ_MODULE } from "@repo/domain-modules/authz";
import { MedusaContainer } from "@medusajs/framework/types";

export async function ensureAdminAccess(
  container: MedusaContainer,
  userId: string,
) {
  const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

  // Reuse existing permissions if they exist
  const existingPerms = await service.listAuthzPermissions({
    target: "/admin/rbac",
  });

  let permissions;
  if (existingPerms.length >= 3) {
    permissions = existingPerms;
  } else {
    permissions = await service.createAuthzPermissions([
      { kind: "read", target: "/admin/rbac", type: "predefined" },
      { kind: "write", target: "/admin/rbac", type: "predefined" },
      { kind: "delete", target: "/admin/rbac", type: "predefined" },
    ]);
  }

  const [role] = await service.createRoles([
    {
      name: "Super Admin " + Date.now(),
      description: "Full RBAC access",
      permissions: permissions.map((p) => p.id),
    },
  ]);

  // Update or create member
  const [existingMember] = await service.listAuthzMembers({
    user_id: userId,
  });

  if (existingMember) {
    await service.updateAuthzMembers([
      { id: existingMember.id, role_id: role.id },
    ]);
  } else {
    await service.createAuthzMembers([{ user_id: userId, role_id: role.id }]);
  }

  return { role, permissions };
}

export async function createTestPermission(
  container: MedusaContainer,
  overrides?: { kind?: string; target?: string; type?: string },
) {
  const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

  const [permission] = await service.createAuthzPermissions([
    {
      kind: (overrides?.kind as "read" | "write" | "delete") ?? "read",
      target: overrides?.target ?? "/admin/test-resource",
      type: (overrides?.type as "predefined" | "custom") ?? "custom",
    },
  ]);

  return permission;
}

export async function createTestCategory(
  container: MedusaContainer,
  overrides?: {
    name?: string;
    description?: string;
    permissions?: {
      kind: "read" | "write" | "delete";
      target: string;
      type: "predefined" | "custom";
    }[];
  },
) {
  const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

  const category = await service.createPermissionCategory({
    name: overrides?.name ?? "Test Category",
    description: overrides?.description ?? "A test category",
    permissions: overrides?.permissions ?? [
      { kind: "read", target: "/admin/test-resource", type: "custom" },
    ],
  });

  return category;
}

export async function createTestRole(
  container: MedusaContainer,
  permissionIds: string[],
  overrides?: { name?: string; description?: string },
) {
  const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

  const [role] = await service.createRoles([
    {
      name: overrides?.name ?? "Test Role",
      description: overrides?.description ?? "A test role",
      permissions: permissionIds,
    },
  ]);

  return role;
}
