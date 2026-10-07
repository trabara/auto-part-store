import { localizedText } from "@repo/framework/core";
import { useTranslation } from "react-i18next";

/** A localized value (`fields.localized()`) in the admin user's language. */
export function LocalizedText({ value, empty = "—" }: { value: unknown; empty?: string }) {
  const { i18n } = useTranslation();
  return <>{localizedText(value as Record<string, string> | null, i18n.language) ?? empty}</>;
}
