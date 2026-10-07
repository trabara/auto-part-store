import type { ConditionInput, ConditionOperator } from "../../contract/conditions";
import { isListOperator } from "./operators";

// Storage of condition values (FitmentCondition.value / value_to are text).

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
