import { z } from "@medusajs/framework/zod";

const IsoDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (s) => new Date(s),
  encode: (d) => d.toISOString(),
})
export const BaseSchema = z.object({
  id: z.string(),
  created_at: IsoDate.nullish(),
  updated_at: IsoDate.nullish(),
  deleted_at: IsoDate.nullish(),
})

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

/** Keys the server owns; never part of a create/update payload. */
export const SERVER_MANAGED_KEYS: readonly string[] = Object.keys(BaseSchema.shape)

export type Model<T> = z.infer<typeof BaseSchema> & T;

export type ModelSchema<T> = z.ZodObject<{
  [K in keyof T]-?: z.ZodType<T[K]>;
}>;

export function omitBaseSchema<S extends z.ZodObject>(
  schema: S,
  mask?: z.util.Exactly<{}, z.infer<S>>,
) {
  return schema.omit({ ...BASE_MASK, ...mask });
}

export function createDto(schema: z.ZodObject<any>) {
  return schema.omit({ ...BASE_MASK });
}

export function updateDto(schema: z.ZodObject<any>) {
  return schema.partial().extend({
    id: z.string(),
  });
}
