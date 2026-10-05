import type { FeatureDef, ModuleDef } from "@repo/framework/core";
import { isToOne } from "@repo/framework/entity";
import { getZodFieldInfo, getZodShape } from "@repo/framework/utils";
import type { z } from "@medusajs/framework/zod";
import { featureRelations } from "./routes";

/**
 * Data-table filter state → top-level API filters. Text filters become a
 * case-insensitive contains (`$ilike`); select/number/date values pass through
 * (arrays mean IN, objects carry operators).
 */
export function toQueryFilters(
  filters: Record<string, unknown> | undefined,
  schema: z.ZodTypeAny,
): Record<string, unknown> {
  const shape = getZodShape(schema);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    const field = shape[key];
    const isText = field && getZodFieldInfo(field).baseType === "string";
    out[key] = isText && typeof value === "string" ? { $ilike: `%${value}%` } : value;
  }
  return out;
}

/**
 * `?fields=` for a feature: own fields and label fields, plus `*rel` and the
 * target's label fields for each visible to-one relation.
 */
export function entityFields(module: ModuleDef, feature: FeatureDef): string {
  const fields = [...feature.entity.query.fields, ...feature.entity.label.fields];
  for (const r of featureRelations(module, feature)) {
    if (!isToOne(r.relation)) continue;
    fields.push(`*${r.key}`);
    for (const f of r.targetEntity?.label.fields ?? []) fields.push(`${r.key}.${f}`);
  }
  return [...new Set(fields)].join(",");
}
