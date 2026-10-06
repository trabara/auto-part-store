// Condition words in the admin user's language: attribute and value labels
// (from the catalog's translation keys), operators, validation messages and
// the editor's own text (`modules.fitments.messages.conditions.*`).
import { i18nKeys } from "@repo/framework/core";
import {
  CONDITION_MESSAGES,
  englishConditionTexts,
  OPERATOR_LABELS,
  type ConditionAttribute,
  type ConditionTexts,
} from "@repo/module-fitment/conditions";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { en } from "../i18n/en";

type Conditions = typeof en.messages.conditions;
type Section = "editor" | "drawer" | "section";

const key = (path: string) => i18nKeys.message("fitments", `conditions.${path}`);

export function useConditionTexts() {
  const { t } = useTranslation();
  return useMemo(() => {
    const tr = (k: string, fallback: string, vars: Record<string, string | number> = {}) =>
      t(k, { defaultValue: fallback, ...vars }) as string;
    const texts: ConditionTexts = {
      attribute: (a) => (a.i18n?.label ? tr(a.i18n.label, a.label) : a.label),
      value: (a, v) => {
        const english = englishConditionTexts.value(a, v);
        const src = a.i18n?.values;
        return src ? tr(i18nKeys.value(src.entity, src.field, v), english) : english;
      },
      operator: (op) => tr(key(`operators.${op}`), OPERATOR_LABELS[op]),
      message: (k, vars) => tr(key(`validation.${k}`), CONDITION_MESSAGES[k], vars),
    };
    return {
      ...texts,
      /** Picker group of an attribute. */
      group: (a: ConditionAttribute) => (a.i18n?.group ? tr(a.i18n.group, a.group ?? "") : (a.group ?? "")),
      /** The editor's own text. */
      text: <S extends Section>(section: S, k: keyof Conditions[S] & string) =>
        tr(key(`${section}.${k}`), (en.messages.conditions[section] as Record<string, string>)[k]!),
    };
  }, [t]);
}

export type ConditionTextsHook = ReturnType<typeof useConditionTexts>;
