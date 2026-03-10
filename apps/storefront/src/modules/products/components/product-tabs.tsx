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
  const text = product.description
  if (!text) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No description available.
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
  const hasDimensions =
    product.weight || product.length || product.width || product.height

  const metadata = product.metadata as Record<string, string> | null | undefined

  const hasMetadata = metadata && Object.keys(metadata).length > 0

  if (!hasDimensions && !hasMetadata) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No specifications available.
      </p>
    )
  }

  return (
    <div className="py-2">
      {hasDimensions && (
        <div className="divide-y divide-border/50">
          <SpecRow
            label="Weight"
            value={product.weight ? `${product.weight} g` : null}
          />
          <SpecRow
            label="Length"
            value={product.length ? `${product.length} mm` : null}
          />
          <SpecRow
            label="Width"
            value={product.width ? `${product.width} mm` : null}
          />
          <SpecRow
            label="Height"
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
  if (fitments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No vehicle compatibility data available for this product.
      </p>
    )
  }

  return (
    <div className="py-2 overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-border bg-accent/30">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Make
            </th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Model
            </th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Years
            </th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Body
            </th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Engine
            </th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Drive
            </th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Trans.
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
          Description
        </TabsTrigger>
        <TabsTrigger
          value="specifications"
          className=" px-4 py-2.5 text-sm font-medium"
        >
          Specifications
        </TabsTrigger>
        <TabsTrigger
          value="fitment"
          className=" px-4 py-2.5 text-sm font-medium"
        >
          Vehicle Fitment
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
