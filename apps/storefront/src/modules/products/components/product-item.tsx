"use client"

import { Link } from "@/i18n/navigation"
import { getProductPrice } from "@/lib/util/product"
import { useAddToCart } from "@/modules/cart/hooks/use-cart"
import { StoreProduct } from "@medusajs/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2, ShoppingCart, Tag } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { createElement, HTMLAttributes } from "react"
import { Display } from "../types"
import { WishlistButton } from "./whishlist-button"

type ProductItemProps = HTMLAttributes<HTMLDivElement> & {
  product: StoreProduct
}

function getCheapestVariantId(product: StoreProduct): string | undefined {
  if (!product.variants?.length) return undefined
  type VariantWithPrice = {
    id?: string
    calculated_price?: { calculated_amount: number }
  }
  const sorted = (product.variants as VariantWithPrice[])
    .filter((v) => !!v.calculated_price)
    .sort(
      (a, b) =>
        (a.calculated_price?.calculated_amount ?? 0) -
        (b.calculated_price?.calculated_amount ?? 0)
    )
  return sorted[0]?.id
}

export function ProductGridItem({
  product,
  className,
  ...props
}: ProductItemProps) {
  const t = useTranslations("product")
  const { cheapestPrice } = getProductPrice({ product })
  const isSale = cheapestPrice?.price_type === "sale"
  const { add, isPending } = useAddToCart()
  const variantId = getCheapestVariantId(product)

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden bg-background",
        "transition-shadow duration-300 hover:shadow-lg hover:shadow-black/8",
        className
      )}
      {...props}
    >
      {/* Image */}
      <Link
        href={`/p/${product.handle}` as any}
        className="block relative aspect-square overflow-hidden bg-accent/40"
      >
        {isSale && (
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-destructive text-destructive-foreground text-[11px] font-semibold tracking-wide px-2 py-0.5 ">
              -{cheapestPrice?.percentage_diff}%
            </Badge>
          </div>
        )}

        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <WishlistButton className="size-8 bg-background/90 backdrop-blur-sm shadow-sm border border-border/50 hover:bg-background" />
        </div>

        {product.thumbnail ? (
          <Image
            unoptimized
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
            <Tag className="size-12" strokeWidth={1} />
          </div>
        )}

        {/* Hover CTA overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-3">
          <Button
            size="sm"
            className="w-full gap-2  text-xs font-semibold tracking-widest uppercase bg-primary/90 backdrop-blur-sm hover:bg-primary"
            onClick={(e) => {
              e.preventDefault()
              variantId && add(variantId, 1)
            }}
            disabled={isPending || !variantId}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShoppingCart className="size-3.5" />
            )}
            {t("addToCartBtn")}
          </Button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 border-t border-border/50">
        <Link
          href={`/p/${product.handle}` as any}
          className="hover:text-primary transition-colors"
        >
          <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground">
            {product.title}
          </p>
        </Link>

        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-base font-bold tabular-nums">
            {cheapestPrice?.calculated_price ?? "—"}
          </span>
          {isSale && cheapestPrice?.original_price && (
            <span className="text-xs text-muted-foreground line-through tabular-nums">
              {cheapestPrice.original_price}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProductListItem({
  product,
  className,
  ...props
}: ProductItemProps) {
  const t = useTranslations("product")
  const { cheapestPrice } = getProductPrice({ product })
  const isSale = cheapestPrice?.price_type === "sale"
  const { add, isPending } = useAddToCart()
  const variantId = getCheapestVariantId(product)

  return (
    <div
      className={cn(
        "group flex gap-0 bg-background",
        "transition-colors duration-200 hover:bg-accent/30",
        className
      )}
      {...props}
    >
      {/* Image */}
      <Link
        href={`/p/${product.handle}` as any}
        className="relative w-32 md:w-48 shrink-0 overflow-hidden bg-accent/40 block"
      >
        {product.thumbnail ? (
          <Image
            unoptimized
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 128px, 192px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
            <Tag className="size-8" strokeWidth={1} />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 min-w-0 items-stretch p-4 gap-4">
        {/* Left: title + description + mobile price */}
        <div className="flex flex-col justify-between flex-1 min-w-0 gap-2">
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              {isSale && (
                <Badge className="mt-0.5 shrink-0 bg-destructive text-destructive-foreground text-[10px] font-semibold tracking-wide px-1.5 py-0 ">
                  {t("sale")}
                </Badge>
              )}
              <Link
                href={`/p/${product.handle}` as any}
                className="hover:text-primary transition-colors"
              >
                <h6 className="text-sm md:text-base font-semibold leading-snug line-clamp-2 text-foreground">
                  {product.title}
                </h6>
              </Link>
            </div>

            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Mobile price */}
          <div className="md:hidden flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums">
              {cheapestPrice?.calculated_price ?? "—"}
            </span>
            {isSale && cheapestPrice?.original_price && (
              <span className="text-sm text-muted-foreground line-through tabular-nums">
                {cheapestPrice.original_price}
              </span>
            )}
          </div>
        </div>

        {/* Right: price + CTA (desktop) */}
        <div className="hidden md:flex flex-col items-end justify-between shrink-0 w-36">
          <div className="text-right">
            <div className="text-xl font-bold tabular-nums">
              {cheapestPrice?.calculated_price ?? "—"}
            </div>
            {isSale && cheapestPrice?.original_price && (
              <div className="text-sm text-muted-foreground line-through tabular-nums">
                {cheapestPrice.original_price}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 w-full">
            <WishlistButton className="size-8" />
            <Button
              size="sm"
              className="w-full gap-1.5 text-xs font-semibold tracking-widest uppercase" 
              onClick={() => variantId && add(variantId, 1)}
              disabled={isPending || !variantId}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ShoppingCart className="size-3.5" />
              )}
              {t("addToCartBtn")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function createViewProductItem(display: Display) {
  return function ProductItem(props?: ProductItemProps) {
    if (display === "grid") {
      return createElement(ProductGridItem, props)
    } else if (display === "list") {
      return createElement(ProductListItem, props)
    } else {
      throw new Error(`Unknown view type: ${display}`)
    }
  }
}
