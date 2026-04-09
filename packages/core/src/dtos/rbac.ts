import type * as z from "@medusajs/framework/zod";
import type {
  UserSchema,
  MemberSchema,
  RoleSchema,
  PermissionSchema,
  CategorySchema,
  PolicySchema,
} from "../schemas/rbac";

export type User = z.infer<typeof UserSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Policy = z.infer<typeof PolicySchema>;

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
  permissions?: CreatePermissionInput[];
};

// ── AuthzMemberDto — matches the actual DML entity shape ─────────────────────
// The MemberSchema (used for API responses) embeds a `user` object, but the
// DML entity stores `user_id` and `role_id` as FK columns.  This DTO is used
// for the service interface so that the implementation satisfies the type.

export type AuthzMemberDto = {
  id: string;
  user_id: string;
  role_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

// ── Member mutation input types ───────────────────────────────────────────────

export type CreateMemberInput = {
  user_id: string;
  role_id: string;
};

export type UpdateMemberInput = {
  id: string;
  role_id?: string;
  user_id?: string;
};
