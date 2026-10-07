// Readable summaries of a condition tree, in one language or all of them.
import { LOCALES, translator } from "@repo/framework/core";
import type { ConditionAttribute, ConditionGroupInput, ConditionInput, ConditionTexts } from "../../contract/conditions";
import { conditionAttribute, conditionTranslations } from "../../contract/ports";
import { isListOperator } from "./operators";
import { conditionTexts, englishConditionTexts } from "./texts";
import { hasConditions } from "./tree";

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

/** The summary in every locale (`{ en, fr, ar }`), or null without conditions. */
export function summarizeConditionsByLocale(tree: ConditionGroupInput | null | undefined): Record<string, string> | null {
  if (!hasConditions(tree)) return null;
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, summarizeConditions(tree, conditionTexts(translator(conditionTranslations(), locale)))!]),
  );
}
