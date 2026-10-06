import type { z } from "@medusajs/framework/zod";
import type { FeatureDef, ModuleDef } from "@repo/framework/core";
import { isColumnLink, isLink } from "@repo/framework/entity";
import { pick } from "lodash";
import { fieldUiOverrides } from "../helpers/field-ui-overrides";
import { relationOverrides } from "../helpers/relation-overrides";
import { featureRelations } from "./routes";

/** Form overrides for a feature's schema: relation pickers, UI hints, then the feature's own. */
export function formOverrides(module: ModuleDef, feature: FeatureDef, schema: z.ZodTypeAny) {
  return {
    ...relationOverrides(module, feature, schema),
    ...fieldUiOverrides(schema),
    ...(feature.ui.overrides as object),
  };
}

/**
 * Form values for editing `record`: its fields in `schema`, with table-link
 * keys (`vehicle_id`, not columns) seeded from the linked record.
 */
export function recordDefaults(
  module: ModuleDef,
  feature: FeatureDef,
  schema: z.ZodObject<any>,
  record: Record<string, any>,
): Record<string, unknown> {
  const values: Record<string, unknown> = pick(record, Object.keys(schema.shape));
  for (const rel of featureRelations(module, feature)) {
    const field = `${rel.key}_id`;
    if (isLink(rel.relation) && !isColumnLink(rel.relation) && field in schema.shape) {
      values[field] = record[rel.key]?.id ?? null;
    }
  }
  return values;
}

/** `keys` in the feature's wizard order (steps first, then the rest). */
export function stepOrdered(feature: FeatureDef, keys: string[]): string[] {
  const order = (feature.ui.steps ?? []).flatMap((step) => step.fields as string[]);
  return [...order.filter((key) => keys.includes(key)), ...keys.filter((key) => !order.includes(key))];
}
