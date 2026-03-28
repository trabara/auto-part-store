import { z } from "@medusajs/framework/zod";

export const BaseSchema = z.object({
  id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

export const CategorySchema = BaseSchema.extend({
  name: z.string(),
  description: z.string().nullable(),
});

export const PermissionSchema = BaseSchema.extend({
  kind: z.enum(["read", "write", "delete"]),
  target: z.string(),
  type: z.enum(["predefined", "custom"]),
  category: CategorySchema
});

export const PolicySchema = BaseSchema.extend({
  name: z.enum(["ALLOW", "DENY"]),
  permission: PermissionSchema
});

export const RoleSchema = BaseSchema.extend({
  name: z.string(),
  description: z.string().nullable(),
  is_default: z.boolean(),
  policies: z.array(PolicySchema).default([]),
});

export const MemberSchema = BaseSchema.extend({
  user_id: z.string(),
  role: RoleSchema,
});

export const RoleFiltersSchema = z.object({
  is_default: z.boolean().optional(),
});

export const CreatePolicySchema = z.object({
  name: z.enum(["ALLOW", "DENY"]),
  permission_id: z.string(),
});

export const CreateRoleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  is_default: z.boolean().default(false),
  policies: z.array(CreatePolicySchema).min(1, "At least one policy is required"),
});

export const UpdateRoleSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  is_default: z.boolean().optional(),
});

export const AssignRoleSchema = z.object({
  user_id: z.string(),
});

export const PermissionFiltersSchema = z.object({
  type: z.enum(["predefined", "custom"]).optional(),
  kind: z.enum(["read", "write", "delete"]).optional(),
  category_id: z.string().optional(),
});

export const CreatePermissionSchema = z.object({
  kind: z.enum(["read", "write", "delete"]),
  target: z.string(),
  category_id: z.string().optional(),
});

export const CheckAccessSchema = z.object({
  path: z.string(),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
});

export type Role = z.infer<typeof RoleSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type Member = z.infer<typeof MemberSchema>;
export type RoleFilters = z.infer<typeof RoleFiltersSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type CreatePolicyInput = z.infer<typeof CreatePolicySchema>;
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;
export type PermissionFilters = z.infer<typeof PermissionFiltersSchema>;
export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>;
export type CheckAccessInput = z.infer<typeof CheckAccessSchema>;
