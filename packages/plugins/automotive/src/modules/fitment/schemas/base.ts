import { z } from "@medusajs/framework/zod";

export const BaseSchema = z.object({
  id: z.string().min(1),
  created_at: z.union([z.string().datetime(), z.date()]).optional(),
  updated_at: z.union([z.string().datetime(), z.date()]).optional(),
  deleted_at: z.union([z.string().datetime(), z.date()]).optional(),
});

type BaseMaskType = {
  created_at: true;
  updated_at: true;
  deleted_at: true;
  id: true;
};

export const BASE_MASK: z.util.Exactly<
  BaseMaskType,
  z.infer<typeof BaseSchema>
> = {
  created_at: true,
  updated_at: true,
  deleted_at: true,
  id: true,
};

export type Model<T> = z.infer<typeof BaseSchema> & T;

export type ModelSchema<T> = z.ZodObject<{
  [K in keyof T]-?: z.ZodType<T[K]>;
}>;
