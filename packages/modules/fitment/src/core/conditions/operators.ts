import type { ConditionDataType, ConditionOperator } from "../../contract/conditions";
import { en } from "../../contract/i18n/en";

/** Operators each data type supports, in picker order. */
export const OPERATORS_BY_TYPE: Record<ConditionDataType, readonly ConditionOperator[]> = {
  enum: ["eq", "neq", "in", "not_in"],
  string: ["eq", "neq", "in", "not_in"],
  // "between" early: ranges are the common case for numbers.
  number: ["eq", "neq", "between", "gte", "lte", "gt", "lt"],
  boolean: ["eq"],
};

/** English operator words ("is", "is between"…), from the module's messages. */
export const OPERATOR_LABELS: Record<ConditionOperator, string> = en.messages.conditions.operators;

export const isListOperator = (op: ConditionOperator) => op === "in" || op === "not_in";
