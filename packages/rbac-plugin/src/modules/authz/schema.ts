import { z } from "@medusajs/framework/zod";
import { createFindParams, createOperatorMap } from "@medusajs/medusa/api/utils/validators";

export const BaseFindParams = createFindParams();

export const BaseSchema = z.object({
  id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
});

export const MemberSchema = BaseSchema.extend({
  user: UserSchema,
});

export const CategorySchema = BaseSchema.extend({
  name: z.string(),
  description: z.string().nullable(),
});

export const RoleSchema = BaseSchema.extend({
  name: z.string(),
  description: z.string().nullable(),
});

export const KindEnum = z.enum(["read", "write", "delete"]);

export const TypeEnum = z.enum(["predefined", "custom"]);

export const PermissionSchema = BaseSchema.extend({
  kind: KindEnum,
  type: TypeEnum,
  target: z.string(),
  category: CategorySchema.optional(),
});

export const PolicySchema = BaseSchema.extend({
  role: RoleSchema,
  permission: PermissionSchema,
});

export const CreatePolicySchema = z.object({
  permission_id: z.string(),
});

export const CreateRoleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  permissions: z
    .array(z.string())
    .min(1, "At least one policy is required"),
});

export const UpdateRoleSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const AssignUsersSchema = z.object({
  userIds: z.array(z.string()).default([]),
});

export const CreatePermissionSchema = z.object({
  kind: KindEnum.default("read"),
  type: TypeEnum.default("custom"),
  target: z.string().nonempty("Target is required"),
  category_id: z.string().optional(),
});

export const UpdatePermissionSchema = z.object({
  kind: KindEnum.optional(),
  type: TypeEnum.optional(),
  target: z.string().optional(),
  category_id: z.string().optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  permissions: z
    .array(CreatePermissionSchema)
    .min(1, "At least one permission is required"),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  description: z.string().optional(),
  permissions: z
    .array(CreatePermissionSchema)
    .min(1, "At least one permission is required")
    .optional(),
});

export const CategoryPermissionsSchema = CategorySchema.extend({
  permissions: z.array(PermissionSchema),
});

export const PermissionFiltersSchema = BaseFindParams.extend({
  filters: z.object({
    id: createOperatorMap(z.string()),
    kind: createOperatorMap(KindEnum),
    type: createOperatorMap(TypeEnum),
    target: createOperatorMap(z.string()),
  }).optional(),
});

export const RoleFiltersSchema = BaseFindParams.extend({
  filters: z.object({
    id: createOperatorMap(z.string()),
    name: createOperatorMap(z.string()),
    description: createOperatorMap(z.string()),
  }).optional(),
});

export const CategoryFiltersSchema = BaseFindParams.extend({
  filters: z.object({
    id: createOperatorMap(z.string()),
    name: createOperatorMap(z.string()),
    description: createOperatorMap(z.string()),
  }).optional(),
});

export const UserFiltersSchema = BaseFindParams.extend({
  filters: z.object({
    id: createOperatorMap(z.string()),
    email: createOperatorMap(z.string()),
    first_name: createOperatorMap(z.string()),
    last_name: createOperatorMap(z.string()),
  }).optional(),
});

export type Base = z.infer<typeof BaseSchema>;
export type User = z.infer<typeof UserSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Policy = z.infer<typeof PolicySchema>;

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type CreatePolicyInput = z.infer<typeof CreatePolicySchema>;
export type AssignUsersInput = z.infer<typeof AssignUsersSchema>;
export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type CategoryPermissionsResult = z.infer<typeof CategoryPermissionsSchema>;