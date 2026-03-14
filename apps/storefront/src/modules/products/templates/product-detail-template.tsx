"use client"

import { Badge } from "@repo/ui/components/badge"
import { Separator } from "@repo/ui/components/separator"
import { cn } from "@repo/ui/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb"
import { type ProductFitment } from "@/lib/data/fitments"
import { type Fitment } from "@/lib/types"
import { ProductGallery } from "@/modules/products/components/product-gallery"
import { VariantSelector } from "@/modules/products/components/variant-selector"
import { ProductActions } from "@/modules/products/components/product-actions"
import { ProductTabs } from "@/modules/products/components/product-tabs"
import { ProductGridItem } from "@/modules/products/components/product-item"
import { HttpTypes } from "@medusajs/types"
import { Link } from "@/i18n/navigation"
import { ArrowRight, CheckCircle2, Tag, XCircle } from "lucide-react"
import React, { useState } from "react"
import { useTranslations } from "next-intl"

type BreadcrumbSegment = { name: string; href: string }

/** Walk a category's parent_category chain and return segments root → leaf. */
function buildCategorySegments(
  category: HttpTypes.StoreProductCategory
): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = []
  const handles: string[] = []

  // Collect ancestors from the category chain (leaf first, then walk up)
  const chain: HttpTypes.StoreProductCategory[] = []
  let cur: HttpTypes.StoreProductCategory | null | undefined = category
  while (cur) {
    chain.unshift(cur)
    cur = cur.parent_category ?? null
  }

  // Build cumulative hrefs: /handle1, /handle1/handle2, …
  for (const seg of chain) {
    if (seg.handle) handles.push(seg.handle)
    segments.push({ name: seg.name, href: `/${handles.join("/")}` })
  }

  return segments
}

function ProductBreadcrumb({ product }: { product: HttpTypes.StoreProduct }) {
  const t = useTranslations("product")
  // Use the first category if available
  const primaryCategory = product.categories?.[0] ?? null
  const categorySegments = primaryCategory
    ? buildCategorySegments(primaryCategory)
    : []

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {/* Home */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">{t("home")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Category ancestors + leaf */}
        {categorySegments.map((seg) => (
          <React.Fragment key={seg.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={seg.href as any}>{seg.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}

        {/* Product title — non-linked current page */}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="max-w-[200px] truncate sm:max-w-xs">
            {product.title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

type ProductDetailTemplateProps = {
  product: HttpTypes.StoreProduct
  fitments: ProductFitment[]
  activeFitment: Fitment | null
  relatedProducts: HttpTypes.StoreProduct[]
}

function buildInitialVariantId(
  product: HttpTypes.StoreProduct
): string | undefined {
  const variants = product.variants ?? []
  if (!variants.length) return undefined
  if (!product.options?.length) return variants[0]?.id
  // Pick the first variant that has a calculated price
  const withPrice = variants.find((v) => (v as any).calculated_price)
  return withPrice?.id ?? variants[0]?.id
}

/** Human-readable label for a fitment, e.g. "2018–2022 Toyota Corolla" */
function fitmentLabel(fitment: Fitment): string {
  const make = fitment.model?.make?.name ?? ""
  const model = fitment.model?.name ?? ""
  const yearStart = fitment.year_start ?? ""
  const yearEnd = fitment.year_end ?? ""
  const years =
    yearStart && yearEnd
      ? yearStart === yearEnd
        ? `${yearStart}`
        : `${yearStart}–${yearEnd}`
      : yearStart
        ? `${yearStart}+`
        : ""
  return [years, make, model].filter(Boolean).join(" ")
}

export function ProductDetailTemplate({
  product,
  fitments,
  activeFitment,
  relatedProducts,
}: ProductDetailTemplateProps) {
  const t = useTranslations("product")
  const [selectedVariantId, setSelectedVariantId] = useState<
    string | undefined
  >(buildInitialVariantId(product))

  const selectedVariant = selectedVariantId
    ? (product.variants ?? []).find((v) => v.id === selectedVariantId)
    : product.variants?.[0]

  const tags = product.tags ?? []

  // Fitment compatibility
  const isCompatible =
    activeFitment != null && fitments.some((f) => f.id === activeFitment.id)
  const isIncompatible =
    activeFitment != null && fitments.length > 0 && !isCompatible

  return (
    <div className="snap-container py-6 md:py-10">
      {/* Breadcrumb */}
      <ProductBreadcrumb product={product} />

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* ── Left: Gallery (sticky on large screens) ────────────────────── */}
        <div className="w-full lg:w-[45%] lg:sticky lg:top-48">
          <ProductGallery product={product} selectedVariant={selectedVariant} />
        </div>

        {/* ── Right: Info + Actions ────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
          {/* Title & subtitle */}
          <div className="flex flex-col gap-1">
            {product.subtitle && (
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                {product.subtitle}
              </p>
            )}
            <h1 className="text-left! text-2xl md:text-3xl font-bold leading-tight tracking-tight text-foreground">
              {product.title}
            </h1>
            {selectedVariant?.sku && (
              <p className="!mt-0 text-xs text-muted-foreground font-mono tracking-wider">
                SKU: {selectedVariant.sku}
              </p>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs border-border/80 flex items-center gap-1"
                >
                  <Tag className="size-2.5" />
                  {tag.value}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* Fitment compatibility badge */}
          {isCompatible && activeFitment && (
            <div className="flex items-center gap-2 p-3 border border-green-500/40 bg-green-50/60  text-sm text-green-800 dark:bg-green-950/20 dark:text-green-300 dark:border-green-500/30">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                {t("compatibleWith")}{" "}
                <span className="font-semibold">
                  {fitmentLabel(activeFitment)}
                </span>
              </span>
            </div>
          )}

          {isIncompatible && activeFitment && (
            <div className="flex items-center gap-2 p-3 border border-destructive/30 bg-destructive/5  text-sm text-destructive dark:border-destructive/40">
              <XCircle className="size-4 shrink-0" />
              <span>
                {t("notCompatibleWith")}{" "}
                <span className="font-semibold">
                  {fitmentLabel(activeFitment)}
                </span>
              </span>
            </div>
          )}

          {/* Variant selector */}
          {(product.options?.length ?? 0) > 0 && (
            <>
              <VariantSelector
                product={product}
                onVariantChange={setSelectedVariantId}
              />
              <Separator />
            </>
          )}

          {/* Price + Stock + Add to cart */}
          <ProductActions
            product={product}
            selectedVariantId={selectedVariantId}
          />

          {/* Vehicle fitment count summary */}
          {fitments.length > 0 && !activeFitment && (
            <div className="flex items-center gap-2 p-3 border border-border/60 bg-muted/30  text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {fitments.length}
              </span>
              <span>
                {fitments.length !== 1
                  ? t("compatibleVehiclesPlural", { count: fitments.length })
                  : t("compatibleVehicles", { count: fitments.length })}{" "}
                {t("seeFitmentTab")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Description / Specifications / Fitment */}
      <div className="mt-12">
        <ProductTabs product={product} fitments={fitments} />
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-border/60 pt-12">
          <div className="flex items-center justify-between mb-8">
            <p className="relative text-2xl font-extrabold uppercase tracking-widest text-foreground">
              <span className="relative">
                {t("relatedProducts")}
                <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-primary" />
              </span>
            </p>
            {product.categories?.[0]?.handle && (
              <Link
                href={`/${product.categories[0].handle}` as any}
                className="hidden md:inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("viewAll")}
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {relatedProducts.map((p) => (
              <ProductGridItem key={p.id} product={p} />
            ))}
          </div>

          {product.categories?.[0]?.handle && (
            <div className="mt-6 flex md:hidden">
              <Link
                href={`/${product.categories[0].handle}` as any}
                className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("viewAllIn", { category: product.categories[0].name })}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
