import { z } from "@medusajs/framework/zod";

export const KindEnum = z.enum(["read", "write", "delete"]);
export const TypeEnum = z.enum(["predefined", "custom"]);

const BaseSchema = z.object({
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

export const MemberSchema = BaseSchema.extend({ user: UserSchema });

export const CategorySchema = BaseSchema.extend({
  name: z.string(),
  description: z.string().nullable(),
});

export const RoleSchema = BaseSchema.extend({
  name: z.string(),
  description: z.string().nullable(),
});

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

export const CategoryPermissionsSchema = CategorySchema.extend({
  permissions: z.array(PermissionSchema),
});
