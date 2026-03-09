"use client"

import { removeLineItem, updateLineItem } from "@/lib/data/cart"
import { convertToLocale } from "@/lib/util/product"
import { StoreCartLineItem } from "@medusajs/types"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { useTransition } from "react"
import { useCartStore } from "../hooks/use-cart"

type CartItemProps = {
  item: StoreCartLineItem
  cartId: string
  currencyCode: string
}

export default function CartItem({
  item,
  cartId,
  currencyCode,
}: CartItemProps) {
  const store = useCartStore(store => ({
    setLoading: store.setLoading,
    updateCartFromServer: store.updateCartFromServer,
  }))

  const [isPending, startTransition] = useTransition()

  const unitPrice = convertToLocale({
    amount: item.unit_price ?? 0,
    currency_code: currencyCode,
  })

  const subtotal = convertToLocale({
    amount: item.subtotal ?? 0,
    currency_code: currencyCode,
  })

  const handleQuantityChange = (newQuantity: number) => {
    startTransition(async () => {
      store.setLoading(true)
      try {
        const updatedCart = await updateLineItem({
          cartId,
          lineItemId: item.id,
          quantity: newQuantity,
        })
        store.updateCartFromServer(updatedCart)
      } finally {
        store.setLoading(false)
      }
    })
  }

  const handleRemove = () => {
    startTransition(async () => {
      store.setLoading(true)
      try {
        const updatedCart = await removeLineItem({
          cartId,
          lineItemId: item.id,
        })
        store.updateCartFromServer(updatedCart)
      } finally {
        store.setLoading(false)
      }
    })
  }

  return (
    <div
      className={cn(
        "flex gap-3 py-3",
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      {/* Thumbnail */}
      <div className="relative size-16 shrink-0 overflow-hidden rounded-sm border border-border/50 bg-accent/30">
        {item.thumbnail ? (
          <Image
            unoptimized
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs">
            No img
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground">{item.subtitle}</p>
        )}
        <p className="text-xs text-muted-foreground">{unitPrice} each</p>

        {/* Quantity controls */}
        <div className="flex items-center gap-1 mt-auto">
          <Button
            variant="outline"
            size="icon"
            className="size-6"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={isPending || item.quantity <= 1}
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-6 text-center text-sm tabular-nums">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-6"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={isPending}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      </div>

      {/* Price + Remove */}
      <div className="flex flex-col items-end justify-between shrink-0">
        <span className="text-sm font-semibold tabular-nums">{subtotal}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
          disabled={isPending}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
