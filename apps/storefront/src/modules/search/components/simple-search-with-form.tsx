"use client"

import { Input } from "@repo/ui/components/input"
import { SearchIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { ComponentProps } from "react"

export function SimpleSearchWithForm(props: ComponentProps<"form">) {
  const t = useTranslations("search")

  return (
    <form action="/search" method="GET" {...props}>
      <div className="relative">
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
          <SearchIcon className="size-4" />
          <span className="sr-only">{t("srOnly")}</span>
        </div>
        <Input
          name="q"
          type="search"
          placeholder={t("placeholder")}
          className="bg-background peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
        />
      </div>
    </form>
  )
}
