import type { FeatureDef, ModuleDef } from "@repo/framework/core";
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

/** `?fields=` for a feature: own fields plus `*rel` for visible to-one relations. */
export function entityFields(module: ModuleDef, feature: FeatureDef): string {
  const toOne = featureRelations(module, feature)
    .filter((r) => r.relation.kind === "belongsTo" || r.relation.kind === "hasOne")
    .map((r) => `*${r.key}`);
  return [...feature.entity.query.fields, ...toOne].join(",");
}
