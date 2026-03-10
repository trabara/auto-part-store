"use client"

import { convertToLocale } from "@/lib/util/product"
import { OrderSummary } from "@/modules/cart/components/order-summary"
import { useCart, useCartStore } from "@/modules/cart/hooks/use-cart"
import { StoreCart } from "@medusajs/types"
import { EmptyShoppingCartIcon } from "@repo/icons"
import { Button } from "@repo/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty"
import { ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import CartLineItem from "../components/cart-line-item"

type CartPageTemplateProps = {
  initialCart: StoreCart | null
}

export function CartPageTemplate({ initialCart }: CartPageTemplateProps) {
  // Seed the store with the SSR cart (the CartProvider in layout already
  // handles this, but this ensures the page-level SSR value is fresh)
  const setCart = useCartStore((s) => s.setCart)
  useEffect(() => {
    if (initialCart) setCart(initialCart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { cart } = useCart()

  const items = cart?.items ?? []
  const hasItems = items.length > 0
  const currencyCode = cart?.currency_code ?? "usd"
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!hasItems) {
    return (
      <div className="snap-container py-12">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <EmptyShoppingCartIcon className="size-20 text-muted-foreground/40" />
            </EmptyMedia>
            <EmptyTitle className="text-muted-foreground">
              Your cart is empty
            </EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  // ── Full cart ────────────────────────────────────────────────────────────────
  return (
    <div className="snap-container py-8">
      {/* Page heading */}
      <div className="mb-6 flex items-center gap-3">
        <ShoppingBag className="size-6 text-primary" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold tracking-tight">
          Shopping Cart
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
        </h1>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* ── Left: items ─────────────────────────────────────────────────── */}
        <div className="w-full xl:flex-1 min-w-0">
          <div className="bg-card border border-border overflow-hidden">
            {/* Column headers — desktop only */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 border-b border-border bg-accent/30 text-xs font-medium text-muted-foreground uppercase tracking-widest">
              <span>Product</span>
              <span className="text-right w-24">Subtotal</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-border/50 px-6">
              {items.map((item) => (
                <CartLineItem
                  key={item.id}
                  item={item}
                  cartId={cart!.id}
                  currencyCode={currencyCode}
                />
              ))}
            </div>  

            {/* Cart footer — subtotal row */}
            <div className="px-6 py-4 border-t border-border bg-accent/10 flex items-center justify-between gap-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <Link href="/">← Continue Shopping</Link>
              </Button>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="text-base font-bold tabular-nums">
                  {convertToLocale({
                    amount: cart?.subtotal ?? 0,
                    currency_code: currencyCode,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: order summary ─────────────────────────────────────────── */}
        <div className="w-full xl:w-80 shrink-0">
          <OrderSummary />
        </div>
      </div>
    </div>
  )
}
