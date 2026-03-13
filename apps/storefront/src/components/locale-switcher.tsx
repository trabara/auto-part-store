"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  fr: "FR",
  ar: "ع",
}

export function LocaleSwitcher() {
  const t = useTranslations("localeSwitcher")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <select
      aria-label={t("label")}
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="bg-transparent text-accent text-xs font-semibold border border-accent/30 px-2 py-1 cursor-pointer hover:border-accent/60 transition-colors focus:outline-none"
    >
      {routing.locales.map((loc) => (
        <option key={loc} value={loc} className="text-foreground bg-background">
          {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
        </option>
      ))}
    </select>
  )
}
