// Helpers to build condition attributes (the catalog the domain provides,
// see ../../contract/ports.ts) from entity schemas.
import type { z } from "@medusajs/framework/zod";
import { getZodFieldInfo } from "@repo/framework/utils";
import type { ConditionAttribute, ConditionDataType } from "../../contract/conditions";

/** "PLUG_IN_HYBRID" → "Plug-in hybrid": the default label of an enum value. */
export const humanizeValue = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase().replace(/_in_/g, "-in ").replace(/_/g, " ");

export type AttributeMeta = { label?: string; unit?: string; group?: string };

/** An attribute for `code` typed from a Zod field (enums get their values). */
export function describeAttribute(
  code: string,
  field: z.ZodTypeAny,
  meta: AttributeMeta = {},
  valueLabel: (value: string) => string = humanizeValue,
): ConditionAttribute {
  const info = getZodFieldInfo(field);
  const base = { code, label: meta.label ?? code, unit: meta.unit, group: meta.group };
  if (info.baseType === "enum") {
    return { ...base, data_type: "enum", values: (info.enumValues ?? []).map((value) => ({ value, label: valueLabel(value) })) };
  }
  const data_type: ConditionDataType =
    info.baseType === "number" ? "number" : info.baseType === "boolean" ? "boolean" : "string";
  return { ...base, data_type };
}

const SYSTEM_FIELDS = ["id", "created_at", "updated_at", "deleted_at"];

/**
 * Attributes for every field of an entity schema, e.g. a vehicle's:
 * `attributesFromSchema(VehicleEngine.schema, { prefix: "engine.", group: "Engine", meta })`.
 */
export function attributesFromSchema(
  schema: { shape: Record<string, z.ZodTypeAny> },
  options: {
    prefix?: string;
    group?: string;
    meta?: Record<string, AttributeMeta>;
    valueLabel?: (value: string) => string;
    exclude?: string[];
  } = {},
): ConditionAttribute[] {
  const { prefix = "", group, meta = {}, valueLabel, exclude = [] } = options;
  return Object.entries(schema.shape)
    .filter(([key]) => !SYSTEM_FIELDS.includes(key) && !exclude.includes(key))
    .map(([key, field]) => describeAttribute(`${prefix}${key}`, field, { group, ...meta[`${prefix}${key}`] }, valueLabel));
}
