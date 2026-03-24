"use client"

import { type ProductFitment } from "@/lib/data/fitments"
import { HttpTypes } from "@medusajs/types"
import { Separator } from "@repo/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs"
import { useTranslations } from "next-intl"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
  fitments: ProductFitment[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatYearRange(yearStart: number, yearEnd: number | null): string {
  if (!yearEnd || yearEnd === yearStart) return String(yearStart)
  return `${yearStart}–${yearEnd}`
}

function formatEngine(engine: ProductFitment["engine"]): string {
  const parts = [engine.size + "L", engine.type, engine.fuel]
  if (engine.tech) parts.push(engine.tech)
  return parts.join(" ")
}

// ── Specs row helper ─────────────────────────────────────────────────────────

function SpecRow({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start py-2 gap-4">
      <span className="w-36 shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium flex-1">{String(value)}</span>
    </div>
  )
}

// ── Tab: Description ─────────────────────────────────────────────────────────

function DescriptionTab({ product }: { product: HttpTypes.StoreProduct }) {
  const t = useTranslations("product")
  const text = product.description
  if (!text) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {t("tabs.noDescription")}
      </p>
    )
  }
  return (
    <div className="prose prose-sm max-w-none py-4 text-foreground whitespace-pre-wrap leading-relaxed">
      {text}
    </div>
  )
}

// ── Tab: Specifications ──────────────────────────────────────────────────────

function SpecificationsTab({ product }: { product: HttpTypes.StoreProduct }) {
  const t = useTranslations("product")
  const hasDimensions =
    product.weight || product.length || product.width || product.height

  const metadata = product.metadata as Record<string, string> | null | undefined

  const hasMetadata = metadata && Object.keys(metadata).length > 0

  if (!hasDimensions && !hasMetadata) {
    return (
      <p className="text-sm text-muted-foreground py-4">{t("tabs.noSpecs")}</p>
    )
  }

  return (
    <div className="py-2">
      {hasDimensions && (
        <div className="divide-y divide-border/50">
          <SpecRow
            label={t("tabs.weight")}
            value={product.weight ? `${product.weight} g` : null}
          />
          <SpecRow
            label={t("tabs.length")}
            value={product.length ? `${product.length} mm` : null}
          />
          <SpecRow
            label={t("tabs.width")}
            value={product.width ? `${product.width} mm` : null}
          />
          <SpecRow
            label={t("tabs.height")}
            value={product.height ? `${product.height} mm` : null}
          />
        </div>
      )}
      {hasDimensions && hasMetadata && <Separator className="my-3" />}
      {hasMetadata && (
        <div className="divide-y divide-border/50">
          {Object.entries(metadata!).map(([key, val]) => (
            <SpecRow key={key} label={key} value={String(val)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab: Fitment ─────────────────────────────────────────────────────────────

function FitmentTab({ fitments }: { fitments: ProductFitment[] }) {
  const t = useTranslations("product")
  if (fitments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {t("tabs.noFitment")}
      </p>
    )
  }

  return (
    <div className="py-2 overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-150">
        <thead>
          <tr className="border-b border-border bg-accent/30">
            <th className=" py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {t("tabs.make")}
            </th>
            <th className=" py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {t("tabs.model")}
            </th>
            <th className=" py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {t("tabs.years")}
            </th>
            <th className=" py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {t("tabs.body")}
            </th>
            <th className=" py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {t("tabs.engine")}
            </th>
            <th className=" py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {t("tabs.drive")}
            </th>
            <th className=" py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {t("tabs.trans")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {fitments.map((fitment) => (
            <tr
              key={fitment.id}
              className="hover:bg-accent/20 transition-colors"
            >
              <td className="py-2.5 px-3 font-medium">
                {fitment.model.make.name}
              </td>
              <td className="py-2.5 px-3">{fitment.model.name}</td>
              <td className="py-2.5 px-3 tabular-nums">
                {formatYearRange(fitment.year_start, fitment.year_end)}
              </td>
              <td className="py-2.5 px-3 capitalize">
                {fitment.body_style.toLowerCase().replace("_", " ")}
              </td>
              <td className="py-2.5 px-3 text-muted-foreground">
                {formatEngine(fitment.engine)}
              </td>
              <td className="py-2.5 px-3">{fitment.drive}</td>
              <td className="py-2.5 px-3 capitalize">
                {fitment.transmission.toLowerCase()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ProductTabs({ product, fitments }: ProductTabsProps) {
  const t = useTranslations("product")
  return (
    <Tabs defaultValue="description">
      <TabsList
        variant="line"
        className="w-full justify-start bg-transparent h-auto p-0 gap-0"
      >
        <TabsTrigger
          value="description"
          className=" px-4 py-2.5 text-sm font-medium"
        >
          {t("tabs.description")}
        </TabsTrigger>
        <TabsTrigger
          value="specifications"
          className=" px-4 py-2.5 text-sm font-medium"
        >
          {t("tabs.specifications")}
        </TabsTrigger>
        <TabsTrigger
          value="fitment"
          className=" px-4 py-2.5 text-sm font-medium"
        >
          {t("tabs.vehicleFitment")}
          {fitments.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({fitments.length})
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="description">
        <DescriptionTab product={product} />
      </TabsContent>
      <TabsContent value="specifications">
        <SpecificationsTab product={product} />
      </TabsContent>
      <TabsContent value="fitment">
        <FitmentTab fitments={fitments} />
      </TabsContent>
    </Tabs>
  )
}
