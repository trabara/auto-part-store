import * as z from "@medusajs/framework/zod";

export const BaseSchema = z.object({
  id: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

type BaseMaskType = {
  created_at: true;
  updated_at: true;
  deleted_at: true;
  id: true;
};

export const BASE_MASK = {
  created_at: true,
  updated_at: true,
  deleted_at: true,
  id: true,
} as z.util.Exactly<BaseMaskType, z.infer<typeof BaseSchema>>;
