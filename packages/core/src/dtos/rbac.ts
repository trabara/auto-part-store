import type * as z from "@medusajs/framework/zod";
import type {
  UserSchema,
  MemberSchema,
  RoleSchema,
  PermissionSchema,
  CategorySchema,
  PolicySchema,
  CategoryPermissionsSchema,
} from "../schemas/rbac";

export type User = z.infer<typeof UserSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type CategoryPermissionsResult = z.infer<
  typeof CategoryPermissionsSchema
>;

// ── Mutation input types ──────────────────────────────────────────────────────

export type CreateRoleInput = {
  name: string;
  description?: string;
  permissions: string[];
};

export type UpdateRoleInput = {
  name?: string;
  description?: string;
};

export type CreatePolicyInput = {
  permission_id: string;
};

export type AssignUsersInput = {
  userIds: string[];
};

export type CreatePermissionInput = {
  kind?: "read" | "write" | "delete";
  type?: "predefined" | "custom";
  target: string;
  category_id?: string;
};

export type CreateCategoryInput = {
  name: string;
  description?: string;
  permissions: CreatePermissionInput[];
};
