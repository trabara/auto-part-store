// Fitment conditions: the vehicle fields a condition can test (catalog), the
// condition tree as edited in the admin, its validation and its readable
// summary. Isomorphic: shared by the admin editor and the server.
import { z } from "@medusajs/framework/zod";
import { getZodFieldInfo } from "@repo/framework/utils";
import { Vehicle, VehicleEngine, VehicleModel } from "../vehicle/entities/vehicle";

// ── Vehicle attribute catalog ─────────────────────────────────────────────────

export type ConditionDataType = "string" | "number" | "boolean" | "enum";

export type VehicleAttribute = {
  /** Vehicle path the condition reads (`drive`, `engine.fuel`). */
  code: string;
  label: string;
  data_type: ConditionDataType;
  unit?: string;
  /** Allowed values for enums, with labels. */
  values?: { value: string; label: string }[];
};

const LABELS: Record<string, { label: string; unit?: string }> = {
  body_style: { label: "Body style" },
  doors: { label: "Doors" },
  drive: { label: "Drive" },
  transmission: { label: "Transmission" },
  trim: { label: "Trim" },
  year_start: { label: "First production year" },
  year_end: { label: "Last production year" },
  "engine.code": { label: "Engine code" },
  "engine.fuel": { label: "Fuel" },
  "engine.layout": { label: "Engine layout" },
  "engine.cylinders": { label: "Cylinders" },
  "engine.displacement_cc": { label: "Displacement", unit: "cm³" },
  "engine.power_kw": { label: "Power", unit: "kW" },
  "engine.power_hp": { label: "Power (hp)", unit: "hp" },
  "engine.name": { label: "Engine technology" },
  "generation.name": { label: "Generation" },
  "generation.code": { label: "Generation code" },
  "generation.model.name": { label: "Model" },
  "generation.model.category": { label: "Vehicle category" },
  "generation.model.make.name": { label: "Make" },
};

const VALUE_LABELS: Record<string, string> = {
  FWD: "Front-wheel drive",
  RWD: "Rear-wheel drive",
  AWD: "All-wheel drive",
  FOUR_WD: "4×4",
  CVT: "CVT",
  LPG: "LPG",
  CNG: "CNG",
  SUV: "SUV",
  LCV: "Light commercial",
  V: "V",
  W: "W",
};

/** "PLUG_IN_HYBRID" → "Plug-in hybrid" (overrides for acronyms and drives). */
export const valueLabel = (value: string) =>
  VALUE_LABELS[value] ??
  value.charAt(0) + value.slice(1).toLowerCase().replace(/_in_/g, "-in ").replace(/_/g, " ");

function describe(code: string, field: z.ZodTypeAny): VehicleAttribute {
  const info = getZodFieldInfo(field);
  const meta = LABELS[code] ?? { label: code };
  if (info.baseType === "enum") {
    return {
      code,
      ...meta,
      data_type: "enum",
      values: (info.enumValues ?? []).map((value) => ({ value, label: valueLabel(value) })),
    };
  }
  const data_type: ConditionDataType =
    info.baseType === "number" ? "number" : info.baseType === "boolean" ? "boolean" : "string";
  return { code, ...meta, data_type };
}

const ownFields = (schema: { shape: Record<string, z.ZodTypeAny> }) =>
  Object.entries(schema.shape).filter(([k]) => !["id", "created_at", "updated_at", "deleted_at"].includes(k));

/** Every vehicle field a condition can test, generated from the vehicle schemas. */
export const VEHICLE_ATTRIBUTES: readonly VehicleAttribute[] = [
  ...ownFields(Vehicle.schema).map(([k, f]) => describe(k, f)),
  ...ownFields(VehicleEngine.schema).map(([k, f]) => describe(`engine.${k}`, f)),
  describe("generation.name", z.string()),
  describe("generation.code", z.string()),
  describe("generation.model.name", z.string()),
  describe("generation.model.category", VehicleModel.schema.shape.category),
  describe("generation.model.make.name", z.string()),
];

const byCode = new Map(VEHICLE_ATTRIBUTES.map((a) => [a.code, a]));

export const vehicleAttribute = (code: string) => byCode.get(code);

// ── Operators ─────────────────────────────────────────────────────────────────

export const CONDITION_OPERATORS = ["eq", "neq", "gt", "gte", "lt", "lte", "between", "in", "not_in"] as const;
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

export const OPERATORS_BY_TYPE: Record<ConditionDataType, readonly ConditionOperator[]> = {
  enum: ["eq", "neq", "in", "not_in"],
  string: ["eq", "neq", "in", "not_in"],
  // "between" early: ranges are the common case for numbers.
  number: ["eq", "neq", "between", "gte", "lte", "gt", "lt"],
  boolean: ["eq"],
};

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: "is",
  neq: "is not",
  gt: "is above",
  gte: "is at least",
  lt: "is below",
  lte: "is at most",
  between: "is between",
  in: "is one of",
  not_in: "is none of",
};

export const isListOperator = (op: ConditionOperator) => op === "in" || op === "not_in";

// ── Condition tree (admin editor ⇄ API) ───────────────────────────────────────

const Scalar = z.union([z.string(), z.number(), z.boolean()]);

export const ConditionInputSchema = z.object({
  code: z.string(),
  operator: z.enum(CONDITION_OPERATORS),
  value: z.union([Scalar, z.array(z.union([z.string(), z.number()]))]),
  value_to: z.union([z.string(), z.number()]).nullish(),
});
export type ConditionInput = z.infer<typeof ConditionInputSchema>;

export type ConditionGroupInput = {
  operator: "and" | "or";
  conditions: ConditionInput[];
  groups: ConditionGroupInput[];
};

export const MAX_GROUP_DEPTH = 3;

export const ConditionGroupSchema: z.ZodType<ConditionGroupInput> = z.lazy(() =>
  z.object({
    operator: z.enum(["and", "or"]),
    conditions: z.array(ConditionInputSchema).default([]),
    groups: z.array(ConditionGroupSchema).default([]),
  }),
) as any;

/** `PUT` body: the whole tree, or null to remove all conditions. */
export const ReplaceConditionsSchema = z.object({ tree: ConditionGroupSchema.nullable() });

/** Human-readable problems in a tree (empty when valid). */
export function validateTree(tree: ConditionGroupInput, depth = 1, path = "Conditions"): string[] {
  const errors: string[] = [];
  if (depth > MAX_GROUP_DEPTH) return [`${path}: groups can be nested ${MAX_GROUP_DEPTH} levels deep at most.`];
  tree.conditions.forEach((c, i) => {
    const where = `${path} › #${i + 1}`;
    const attr = vehicleAttribute(c.code);
    if (!attr) return errors.push(`${where}: "${c.code}" is not a vehicle field.`);
    if (!OPERATORS_BY_TYPE[attr.data_type].includes(c.operator)) {
      return errors.push(`${where}: ${attr.label} can't use "${OPERATOR_LABELS[c.operator]}".`);
    }
    const values = Array.isArray(c.value) ? c.value : [c.value];
    if (isListOperator(c.operator) && (!Array.isArray(c.value) || !c.value.length)) {
      return errors.push(`${where}: ${attr.label} needs at least one value.`);
    }
    if (!isListOperator(c.operator) && Array.isArray(c.value)) {
      return errors.push(`${where}: ${attr.label} needs a single value.`);
    }
    if (values.some((v) => v === "" || v == null)) return errors.push(`${where}: ${attr.label} needs a value.`);
    if (attr.data_type === "enum") {
      const allowed = new Set(attr.values!.map((v) => v.value));
      const bad = values.filter((v) => !allowed.has(String(v)));
      if (bad.length) errors.push(`${where}: ${bad.join(", ")} is not a valid ${attr.label.toLowerCase()}.`);
    }
    if (attr.data_type === "number") {
      if (values.some((v) => !Number.isFinite(Number(v)))) errors.push(`${where}: ${attr.label} must be a number.`);
      if (c.operator === "between") {
        if (c.value_to == null || !Number.isFinite(Number(c.value_to))) {
          errors.push(`${where}: ${attr.label} needs an upper bound.`);
        } else if (Number(c.value_to) < Number(c.value)) {
          errors.push(`${where}: the upper bound of ${attr.label} is below the lower one.`);
        }
      }
    }
  });
  tree.groups.forEach((g, i) => errors.push(...validateTree(g, depth + 1, `${path} › group ${i + 1}`)));
  return errors;
}

/** Whether a tree has any condition (empty groups don't count). */
export const hasConditions = (tree: ConditionGroupInput | null | undefined): boolean =>
  !!tree && (tree.conditions.length > 0 || tree.groups.some(hasConditions));

// ── Storage (FitmentCondition.value / value_to are text) ──────────────────────

/** Stored text of a condition value: JSON array for in / not_in. */
export const serializeValue = (c: ConditionInput) =>
  isListOperator(c.operator) ? JSON.stringify((c.value as unknown[]).map(String)) : String(c.value);

/** A stored condition back to its tree form (typed by the attribute). */
export function deserializeCondition(row: {
  operator: ConditionOperator;
  value: string;
  value_to: string | null;
  attribute: { code: string; data_type: string };
}): ConditionInput {
  const number = row.attribute.data_type === "number";
  const parse = (v: string) => (number ? Number(v) : v);
  let value: ConditionInput["value"];
  if (isListOperator(row.operator)) {
    const list = row.value.trim().startsWith("[") ? (JSON.parse(row.value) as string[]) : row.value.split(",").map((v) => v.trim());
    value = list.map(parse);
  } else {
    value = row.attribute.data_type === "boolean" ? row.value === "true" : parse(row.value);
  }
  return {
    code: row.attribute.code,
    operator: row.operator,
    value,
    value_to: row.value_to == null ? null : parse(row.value_to),
  };
}

// ── Summary ───────────────────────────────────────────────────────────────────

function describeValue(attr: VehicleAttribute | undefined, value: unknown) {
  if (value === "" || value == null) return "…";
  const text = attr?.data_type === "enum" ? valueLabel(String(value)).toLowerCase() : String(value);
  return attr?.unit ? `${text} ${attr.unit}` : text;
}

function describeCondition(c: ConditionInput): string {
  const attr = vehicleAttribute(c.code);
  const label = attr?.label ?? c.code;
  if (c.operator === "between") {
    return `${label} is between ${describeValue(undefined, c.value)} and ${describeValue(attr, c.value_to)}`;
  }
  if (isListOperator(c.operator)) {
    const list = (c.value as unknown[]).map((v) => describeValue(attr, v));
    return `${label} ${OPERATOR_LABELS[c.operator]} ${list.join(", ")}`;
  }
  return `${label} ${OPERATOR_LABELS[c.operator]} ${describeValue(attr, c.value)}`;
}

/** "Drive is front-wheel drive and (Fuel is diesel or Power is at least 100 kW)" */
export function summarizeConditions(tree: ConditionGroupInput | null | undefined, nested = false): string | null {
  if (!hasConditions(tree)) return null;
  const parts = [
    ...tree!.conditions.map(describeCondition),
    ...tree!.groups.map((g) => summarizeConditions(g, true)).filter((s): s is string => !!s),
  ];
  const text = parts.join(tree!.operator === "and" ? " and " : " or ");
  return nested && parts.length > 1 ? `(${text})` : text;
}
