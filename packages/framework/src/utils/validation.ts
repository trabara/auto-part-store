import { z } from "@medusajs/framework/zod";
import { getZodFieldInfo, getZodShape } from "./zod-introspect";
import { forEach } from "lodash";
import { createOperatorMap } from "@medusajs/medusa/api/utils/validators";

const processDate = (v: unknown) => {
  if (typeof v === "string") {
    return new Date(v);
  }
  return v;
};

export const BaseSchema = z.object({
  id: z.string(),
  created_at: z.preprocess(processDate, z.date().nullable()),
  updated_at: z.preprocess(processDate, z.date().nullable()),
  deleted_at: z.preprocess(processDate, z.date().nullable()),
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

export function omitBaseSchema<S extends z.ZodObject>(
  schema: S,
  mask?: z.util.Exactly<{}, z.infer<S>>,
) {
  return schema.omit({ ...BASE_MASK, ...mask });
}


export function buildFindParamsFilters(schema: z.ZodObject): z.ZodObject {
  const shape = getZodShape(schema);

  let params = z.object();
  forEach(shape, (field, key) => {
    const info = getZodFieldInfo(field);
    const PreProcessed = z.preprocess((v) => {
      if (info.baseType === "date") {
        return new Date(String(v));
      } else if (info.baseType === "number") {
        return Number(v);
      } else if (info.baseType === "array") {
        return JSON.parse(String(v));
      }
      return v;
    }, field);

    params = params.extend({
      [key]: createOperatorMap(PreProcessed).optional(),
    });
  });

  return params;
}