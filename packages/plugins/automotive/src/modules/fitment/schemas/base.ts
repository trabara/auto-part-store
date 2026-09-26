import { z } from "@medusajs/framework/zod";

const process = (v) => {
  if (typeof v === "string") {
    return new Date(v);
  }
  return v;
};

export const BaseSchema = z.object({
  id: z.string(),
  created_at: z.preprocess(process, z.date().nullable()),
  updated_at: z.preprocess(process, z.date().nullable()),
  deleted_at: z.preprocess(process, z.date().nullable()),
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
