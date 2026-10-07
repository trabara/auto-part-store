// Fitment conditions: the attributes a condition can test (an injected
// catalog), the condition tree as edited in the admin, its validation and its
// readable summary. Isomorphic: shared by the admin editor and the server.
//
// The module knows no vehicle: the domain provides the catalog
// (`provideConditionAttributes`), e.g. the vehicle fields a fitment can test.
import { z } from "@medusajs/framework/zod";
import { i18nKeys, LOCALES, translator, type Translate } from "@repo/framework/core";
import { getZodFieldInfo } from "@repo/framework/utils";

// ── Condition attribute catalog (port) ────────────────────────────────────────

export type ConditionDataType = "string" | "number" | "boolean" | "enum";

export type ConditionAttribute = {
  /** Path the condition reads on the tested record (`drive`, `engine.fuel`). */
  code: string;
  label: string;
  data_type: ConditionDataType;
  unit?: string;
  /** Allowed values for enums, with labels. */
  values?: { value: string; label: string }[];
  /** Picker grouping, e.g. "Engine". */
  group?: string;
  /**
   * Translation keys (admin): of the label and group, and the entity field
   * whose enum value labels apply (`entities.<entity>.values.<field>.<value>`).
   */
  i18n?: { label?: string; group?: string; values?: { entity: string; field: string } };
};

/** Supplies the attributes conditions may test; registered by the domain. */
export type ConditionAttributeProvider = () => readonly ConditionAttribute[];

let provider: ConditionAttributeProvider = () => [];
let cache: { list: readonly ConditionAttribute[]; byCode: Map<string, ConditionAttribute> } | null = null;

/**
 * Registers the catalog conditions test (server and admin each call it at
 * startup, from the domain). The last registration wins.
 */
export function provideConditionAttributes(next: ConditionAttributeProvider | readonly ConditionAttribute[]): void {
  provider = typeof next === "function" ? next : () => next;
  cache = null;
}

function catalog() {
  if (!cache) {
    const list = provider();
    cache = { list, byCode: new Map(list.map((a) => [a.code, a])) };
  }
  return cache;
}

/** The registered attributes (empty until the domain provides them). */
export const conditionAttributes = (): readonly ConditionAttribute[] => catalog().list;

export const conditionAttribute = (code: string): ConditionAttribute | undefined => catalog().byCode.get(code);

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

/** Messages of validation and summaries (`{{var}}` placeholders). */
export const CONDITION_MESSAGES = {
  and: "and",
  or: "or",
  root: "Conditions",
  group: "group {{n}}",
  tooDeep: "groups can be nested {{max}} levels deep at most.",
  unknownAttribute: "\"{{code}}\" is not a known attribute.",
  badOperator: "{{attr}} can't use \"{{op}}\".",
  needsValues: "{{attr}} needs at least one value.",
  needsSingle: "{{attr}} needs a single value.",
  needsValue: "{{attr}} needs a value.",
  badValue: "{{value}} is not a valid {{attr}}.",
  notNumber: "{{attr}} must be a number.",
  needsUpper: "{{attr}} needs an upper bound.",
  upperBelow: "the upper bound of {{attr}} is below the lower one.",
};
export type ConditionMessageKey = keyof typeof CONDITION_MESSAGES;

/**
 * Words of validation messages and summaries. The server uses English
 * (`englishConditionTexts`); the admin passes the user's language.
 */
export interface ConditionTexts {
  attribute(attr: ConditionAttribute): string;
  value(attr: ConditionAttribute, value: string): string;
  operator(op: ConditionOperator): string;
  message(key: ConditionMessageKey, vars?: Record<string, string | number>): string;
}

const fill = (template: string, vars: Record<string, string | number> = {}) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));

export const englishConditionTexts: ConditionTexts = {
  attribute: (attr) => attr.label,
  value: (attr, value) => attr.values?.find((v) => v.value === value)?.label ?? humanizeValue(value),
  operator: (op) => OPERATOR_LABELS[op],
  message: (key, vars) => fill(CONDITION_MESSAGES[key], vars),
};

const conditionKey = (path: string) => i18nKeys.message("fitments", `conditions.${path}`);

/**
 * `ConditionTexts` over a translation lookup (admin: i18next; server: the
 * resources registered with `provideConditionTranslations`).
 */
export function conditionTexts(t: Translate): ConditionTexts {
  return {
    attribute: (a) => (a.i18n?.label ? t(a.i18n.label, a.label) : a.label),
    value: (a, v) => {
      const english = englishConditionTexts.value(a, v);
      const src = a.i18n?.values;
      return src ? t(i18nKeys.value(src.entity, src.field, v), english) : english;
    },
    operator: (op) => t(conditionKey(`operators.${op}`), OPERATOR_LABELS[op]),
    message: (k, vars) => t(conditionKey(`validation.${k}`), CONDITION_MESSAGES[k], vars),
  };
}

type Resources = Parameters<typeof translator>[0];
let resources: Resources = {};

/**
 * Registers the admin translation resources (`toAdminI18n(...)` of the
 * domain: this module's messages and the catalog's labels), so stored
 * summaries are written in every locale.
 */
export function provideConditionTranslations(next: Resources): void {
  resources = next;
}

/** The summary in every locale (`{ en, fr, ar }`), or null without conditions. */
export function summarizeConditionsByLocale(tree: ConditionGroupInput | null | undefined): Record<string, string> | null {
  if (!hasConditions(tree)) return null;
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, summarizeConditions(tree, conditionTexts(translator(resources, locale)))!]),
  );
}

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
export function validateTree(
  tree: ConditionGroupInput,
  texts: ConditionTexts = englishConditionTexts,
  depth = 1,
  path = texts.message("root"),
): string[] {
  const m = texts.message;
  const errors: string[] = [];
  if (depth > MAX_GROUP_DEPTH) return [`${path}: ${m("tooDeep", { max: MAX_GROUP_DEPTH })}`];
  tree.conditions.forEach((c, i) => {
    const where = `${path} › #${i + 1}`;
    const add = (key: ConditionMessageKey, vars: Record<string, string | number> = {}) =>
      errors.push(`${where}: ${m(key, vars)}`);
    const attr = conditionAttribute(c.code);
    if (!attr) return add("unknownAttribute", { code: c.code });
    const label = texts.attribute(attr);
    if (!OPERATORS_BY_TYPE[attr.data_type].includes(c.operator)) {
      return add("badOperator", { attr: label, op: texts.operator(c.operator) });
    }
    const values = Array.isArray(c.value) ? c.value : [c.value];
    if (isListOperator(c.operator) && (!Array.isArray(c.value) || !c.value.length)) return add("needsValues", { attr: label });
    if (!isListOperator(c.operator) && Array.isArray(c.value)) return add("needsSingle", { attr: label });
    if (values.some((v) => v === "" || v == null)) return add("needsValue", { attr: label });
    if (attr.data_type === "enum") {
      const allowed = new Set(attr.values!.map((v) => v.value));
      const bad = values.filter((v) => !allowed.has(String(v)));
      if (bad.length) add("badValue", { value: bad.join(", "), attr: label.toLowerCase() });
    }
    if (attr.data_type === "number") {
      if (values.some((v) => !Number.isFinite(Number(v)))) add("notNumber", { attr: label });
      if (c.operator === "between") {
        if (c.value_to == null || !Number.isFinite(Number(c.value_to))) add("needsUpper", { attr: label });
        else if (Number(c.value_to) < Number(c.value)) add("upperBelow", { attr: label });
      }
    }
  });
  tree.groups.forEach((g, i) => errors.push(...validateTree(g, texts, depth + 1, `${path} › ${m("group", { n: i + 1 })}`)));
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

function describeValue(texts: ConditionTexts, attr: ConditionAttribute | undefined, value: unknown, unit = true) {
  if (value === "" || value == null) return "…";
  const text = attr?.data_type === "enum" ? texts.value(attr, String(value)).toLowerCase() : String(value);
  return unit && attr?.unit ? `${text} ${attr.unit}` : text;
}

function describeCondition(texts: ConditionTexts, c: ConditionInput): string {
  const attr = conditionAttribute(c.code);
  const label = attr ? texts.attribute(attr) : c.code;
  const op = texts.operator(c.operator);
  if (c.operator === "between") {
    return `${label} ${op} ${describeValue(texts, attr, c.value, false)} ${texts.message("and")} ${describeValue(texts, attr, c.value_to)}`;
  }
  if (isListOperator(c.operator)) {
    const list = (c.value as unknown[]).map((v) => describeValue(texts, attr, v));
    return `${label} ${op} ${list.join(", ")}`;
  }
  return `${label} ${op} ${describeValue(texts, attr, c.value)}`;
}

/** "Drive is front-wheel drive and (Fuel is diesel or Power is at least 100 kW)" */
export function summarizeConditions(
  tree: ConditionGroupInput | null | undefined,
  texts: ConditionTexts = englishConditionTexts,
  nested = false,
): string | null {
  if (!hasConditions(tree)) return null;
  const parts = [
    ...tree!.conditions.map((c) => describeCondition(texts, c)),
    ...tree!.groups.map((g) => summarizeConditions(g, texts, true)).filter((s): s is string => !!s),
  ];
  const text = parts.join(` ${texts.message(tree!.operator)} `);
  return nested && parts.length > 1 ? `(${text})` : text;
}
