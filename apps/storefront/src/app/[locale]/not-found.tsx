"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

export default function NotFound() {
  const t = useTranslations("notFound")
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-9xl font-bold mb-4">404</p>
      <p className="text-xl mb-8">{t("title")}</p>
      <Link href="/" className="px-4 py-2">
        {t("goHome")}
      </Link>
    </div>
  )
}
