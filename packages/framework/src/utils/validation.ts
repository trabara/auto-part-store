import { z } from "@medusajs/framework/zod";

/** ISO-8601 string on the wire, `Date` in code. */
export const IsoDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (s) => new Date(s),
  encode: (d) => d.toISOString(),
});

/** Fields every Medusa model has; the server owns all of them. */
export const BaseSchema = z.object({
  id: z.string(),
  created_at: IsoDate.nullish(),
  updated_at: IsoDate.nullish(),
  deleted_at: IsoDate.nullish(),
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

/** Keys the server owns; never part of a create/update payload. */
export const SERVER_MANAGED_KEYS: readonly string[] = Object.keys(
  BaseSchema.shape,
);

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

/** Create payload: the entity schema without server-managed fields. */
export function createDto<S extends z.ZodObject>(schema: S) {
  return schema.omit(BASE_MASK);
}

/** Update payload: every field optional, `id` required. */
export function updateDto<S extends z.ZodObject>(schema: S) {
  return schema.partial().extend({ id: z.string() });
}
