import { z } from "@medusajs/framework/zod";
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";
import { KindEnum, TypeEnum } from "../schemas/rbac";

// ── Mutation input schemas ────────────────────────────────────────────────────

export const CreatePolicySchema = z.object({
  permission_id: z.string(),
});

export const CreateRoleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "At least one policy is required"),
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

// ── Find param schemas ────────────────────────────────────────────────────────

const BaseFindParams = createFindParams();

export const PermissionFiltersSchema = BaseFindParams.extend({
  filters: z
    .object({
      id: createOperatorMap(z.string()),
      kind: createOperatorMap(KindEnum),
      type: createOperatorMap(TypeEnum),
      target: createOperatorMap(z.string()),
    })
    .optional(),
});

export const RoleFiltersSchema = BaseFindParams.extend({
  filters: z
    .object({
      id: createOperatorMap(z.string()),
      name: createOperatorMap(z.string()),
      description: createOperatorMap(z.string()),
    })
    .optional(),
});

export const CategoryFiltersSchema = BaseFindParams.extend({
  filters: z
    .object({
      id: createOperatorMap(z.string()),
      name: createOperatorMap(z.string()),
      description: createOperatorMap(z.string()),
    })
    .optional(),
});

export const UserFiltersSchema = BaseFindParams.extend({
  filters: z
    .object({
      id: createOperatorMap(z.string()),
      email: createOperatorMap(z.string()),
      first_name: createOperatorMap(z.string()),
      last_name: createOperatorMap(z.string()),
    })
    .optional(),
});
