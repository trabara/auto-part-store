// Condition words in the admin user's language: attribute and value labels
// (from the catalog's translation keys), operators, validation messages and
// the editor's own text (`modules.fitments.messages.conditions.*`).
import { i18nKeys } from "@repo/framework/core";
import { fitmentTranslations, type ConditionAttribute } from "@repo/module-fitment/contract";
import { conditionTexts } from "@repo/module-fitment/core";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const en = fitmentTranslations.locales.en;
type Conditions = typeof en.messages.conditions;
type Section = "editor" | "drawer" | "section";

const key = (path: string) => i18nKeys.message("fitments", `conditions.${path}`);

export function useConditionTexts() {
  const { t } = useTranslation();
  return useMemo(() => {
    const tr = (k: string, fallback: string, vars: Record<string, string | number> = {}) =>
      t(k, { defaultValue: fallback, ...vars }) as string;
    const texts = conditionTexts(tr);
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
