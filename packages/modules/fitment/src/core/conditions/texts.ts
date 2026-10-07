// Words of validation messages and summaries: English, or any language
// through a translation lookup.
import { i18nKeys, type Translate } from "@repo/framework/core";
import type { ConditionMessageKey, ConditionTexts } from "../../contract/conditions";
import { en } from "../../contract/i18n/en";
import { humanizeValue } from "./catalog";
import { OPERATOR_LABELS } from "./operators";

/** English messages (`{{var}}` placeholders), from the module's messages. */
export const CONDITION_MESSAGES: Record<ConditionMessageKey, string> = en.messages.conditions.validation;

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
