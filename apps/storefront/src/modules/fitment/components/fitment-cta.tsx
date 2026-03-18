"use client"

import { Fitment } from "@/lib/types"
import { cn } from "@repo/ui/lib/utils"
import { CarFront } from "lucide-react"
import { useTranslations } from "next-intl"
import AdvancedSearch from "./advanced-search"

export function FitmentCTA({ fitment, className }: { fitment: Fitment | null, className?: string }) {
  const t = useTranslations("fitment")
  return (
    <div className={cn("flex flex-col lg:flex-row lg:items-start gap-10", className)}>
      {/* Left copy */}
      <div className="lg:w-80 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <CarFront className="size-5 opacity-60" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-60">
            {t("myGarage")}
          </span>
        </div>
        <p className="mt-0! text-3xl md:text-4xl font-extrabold uppercase tracking-tight leading-[1.05] mb-4 text-left whitespace-pre-line">
          {t("findParts")}
        </p>
        <p className="mt-0! text-sm leading-relaxed max-w-xs">
          {t("findPartsDesc")}
        </p>
        {fitment && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 border border-border text-xs font-semibold rounded-md">
            <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
            {fitment.model.make.name} · {fitment.model.name} ·{" "}
            {fitment.year_start}
          </div>
        )}
      </div>

      {/* Right: search form */}
      <div className="flex-1 bg-primary-foreground/5 border border-primary-foreground/10 p-6">
        <AdvancedSearch />
      </div>
    </div>
  )
}
