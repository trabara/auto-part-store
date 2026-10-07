// The condition tree a fitment's conditions form (admin editor ⇄ API), the
// attributes conditions test and the words of their messages: types and
// request schemas, isomorphic. Rules on them live in ../core/conditions.
import { z } from "@medusajs/framework/zod";

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

export const CONDITION_OPERATORS = ["eq", "neq", "gt", "gte", "lt", "lte", "between", "in", "not_in"] as const;
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

/** Keys of validation and summary messages (English source: ./i18n/en.ts). */
export type ConditionMessageKey =
  | "and" | "or" | "root" | "group" | "tooDeep" | "unknownAttribute" | "badOperator" | "needsValues"
  | "needsSingle" | "needsValue" | "badValue" | "notNumber" | "needsUpper" | "upperBelow";

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
