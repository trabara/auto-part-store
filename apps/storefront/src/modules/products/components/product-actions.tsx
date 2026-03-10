"use client"

import { Badge } from "@repo/ui/components/badge"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"
import { getPricesForVariant } from "@/lib/util/product"
import { useAddToCart } from "@/modules/cart/hooks/use-cart"
import { HttpTypes } from "@medusajs/types"
import { Loader2, Minus, Plus, ShoppingCart } from "lucide-react"
import { useState } from "react"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  selectedVariantId: string | undefined
}

function getVariantStock(variant: HttpTypes.StoreProductVariant): number {
  return variant.inventory_quantity ?? 0
}

export function ProductActions({
  product,
  selectedVariantId,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1)
  const { add, isPending } = useAddToCart()

  const variants = product.variants ?? []
  const selectedVariant = selectedVariantId
    ? variants.find((v) => v.id === selectedVariantId)
    : variants[0]

  const prices = selectedVariant ? getPricesForVariant(selectedVariant) : null
  const stock = selectedVariant ? getVariantStock(selectedVariant) : 0
  const inStock = !!selectedVariant?.allow_backorder || stock > 0
  const canAdd = !!selectedVariantId && inStock && !isPending

  const handleAdd = () => {
    if (!selectedVariantId) return
    add(selectedVariantId, quantity)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Price */}
      {prices && (
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold tabular-nums tracking-tight">
            {prices.calculated_price}
          </span>
          {prices.price_type === "sale" && prices.original_price && (
            <>
              <span className="text-lg text-muted-foreground line-through tabular-nums">
                {prices.original_price}
              </span>
              <Badge className="bg-destructive text-destructive-foreground  text-xs font-semibold rounded-none">
                -{prices.percentage_diff}%
              </Badge>
            </>
          )}
        </div>
      )}

      {/* Stock badge */}
      <div>
        {inStock ? (
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium border-green-500/50 text-green-700 bg-green-50",
              "dark:text-green-400 dark:bg-green-950/30",
              "rounded-none"
            )}
          >
            In Stock
            {stock > 0 && stock <= 10 && (
              <span className="ml-1 text-orange-600">— only {stock} left</span>
            )}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className=" text-xs font-medium border-destructive/50 text-destructive bg-destructive/5 rounded-none"
          >
            Out of Stock
          </Badge>
        )}
      </div>

      {/* Quantity + Add to Cart */}
      <div className="flex items-center gap-3">
        {/* Quantity stepper */}
        <div className="flex items-center border border-border ">
          <Button
            size="icon"
            variant="ghost"
            className="size-10"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || isPending}
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-10 text-center text-sm font-semibold tabular-nums select-none">
            {quantity}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="size-10"
            onClick={() => setQuantity((q) => q + 1)}
            disabled={
              isPending ||
              (!selectedVariant?.allow_backorder && quantity >= stock)
            }
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Add to cart */}
        <Button
          size="lg"
          className="flex-1 gap-2  font-semibold tracking-widest uppercase"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShoppingCart className="size-4" />
          )}
          {isPending ? "Adding..." : "Add to Cart"}
        </Button>
      </div>

      {!selectedVariantId && (product.options?.length ?? 0) > 0 && (
        <p className="text-xs text-muted-foreground">
          Select options above to add to cart.
        </p>
      )}
    </div>
  )
}
