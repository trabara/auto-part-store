// The steward panels' text in the admin user's language
// (`modules.vehicles.messages.steward.*`, English as the fallback).
import { i18nKeys } from "@repo/framework/core";
import { vehicleTranslations } from "@repo/module-vehicle/contract";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const en = vehicleTranslations.locales.en.messages.steward;
type Steward = typeof en;

export function useStewardTexts() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      <S extends keyof Steward>(section: S, key: keyof Steward[S] & string) =>
        t(i18nKeys.message("vehicles", `steward.${section}.${key}`), { defaultValue: (en[section] as Record<string, string>)[key] }) as string,
    [t],
  );
}
