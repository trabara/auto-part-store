import { z } from "@medusajs/framework/zod";
import { BaseSchema } from "./base";

export const KindEnum = z.enum(["read", "write", "delete"]);
export const TypeEnum = z.enum(["predefined", "custom"]);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
});

export const MemberSchema = BaseSchema.extend({ user: UserSchema, role: z.lazy<any>(() => RoleSchema) });

export const CategorySchema = BaseSchema.extend({
  name: z.string().describe("The name of the category"),
  description: z.string().nullable().describe("The description of the category"),
  permissions: z.lazy<any>(() => z.array(PermissionSchema)).describe("The permissions that belong to the category"),
});

export const RoleSchema = BaseSchema.extend({
  name: z.string().describe("The name of the role"),
  description: z.string().nullable().describe("The description of the role"),
  members: z.array(MemberSchema).describe("The members that belong to the role"),
  policies: z.lazy<any>(() => z.array(PolicySchema)).describe("The policies associated with the role"),
});

export const PermissionSchema = BaseSchema.extend({
  kind: KindEnum.describe("The kind of permission"),
  type: TypeEnum.describe("The type of permission"),
  target: z.string().describe("The target of the permission"),
  category: CategorySchema.optional().describe("The category of the permission"),
});

export const PolicySchema = BaseSchema.extend({
  role: RoleSchema.describe("The role associated with the policy"),
  permission: PermissionSchema.describe("The permission associated with the policy"),
});