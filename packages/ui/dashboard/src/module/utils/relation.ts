import { z } from "@medusajs/framework/zod";
import { getZodFieldInfo, getZodShape } from "@repo/utils";
import { forEach } from "lodash";

export function classifyAttributes<T extends {}, K extends keyof T = keyof T>(
  schema: z.ZodObject<T>,
  overrides: Record<K, string>,
) {
  let scalar = z.object({});
  let hasMany = z.object({});
  let belongsTo = z.object({});

  const shape = getZodShape(schema);

  forEach(shape, (attr, key) => {
    const info = getZodFieldInfo(attr);
    const fieldKey = overrides?.[key as K] || key;

    if (info.baseType === "array") {
      hasMany = hasMany.extend({ [fieldKey]: attr });
    } else if (info.baseType === "object") {
      belongsTo = belongsTo.extend({ [fieldKey]: attr });
    } else {
      scalar = scalar.extend({ [fieldKey]: attr });
    }
  });

  return { scalar, hasMany, belongsTo };
}


