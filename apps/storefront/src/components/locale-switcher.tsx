"use client"

import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocale, useTranslations } from "next-intl"

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
    <Select
      defaultValue={locale}
      aria-label={t("label")}
      onValueChange={(newLocale) => handleChange(newLocale)}
    >
      <SelectTrigger className="">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((loc) => (
          <SelectItem key={loc} value={loc} className="text-foreground bg-background">
            {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
