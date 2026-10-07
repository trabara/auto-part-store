// The automotive domain's admin text in the user's language
// (`modules.automotive.messages.<path>`), English from ../../contract/i18n/en.ts.
import { i18nKeys } from "@repo/framework/core";
import { useTranslation } from "react-i18next";
import { en } from "../../contract/i18n/en";

const english = (path: string): string =>
  path.split(".").reduce<any>((node, k) => node?.[k], en.messages) ?? path;

export function useDomainText() {
  const { t } = useTranslation();
  return (path: string) => t(i18nKeys.message("automotive", path), { defaultValue: english(path) }) as string;
}
