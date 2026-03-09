"use client"

import { EmptyShoppingCartIcon } from "@repo/icons"
import { Button } from "@repo/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty"
import { Separator } from "@repo/ui/components/separator"
import { cn } from "@repo/ui/lib/utils"
import { convertToLocale } from "@/lib/util/product"
import { useCart } from "@/modules/cart/hooks/use-cart"
import CartItem from "@/modules/cart/components/cart-item"
import { OrderSummary } from "@/modules/cart/components/order-summary"
import { StoreCart } from "@medusajs/types"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useEffect } from "react"
import { useCartStore } from "@/modules/cart/hooks/use-cart"

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
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Column headers — desktop only */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 border-b border-border bg-accent/30 text-xs font-medium text-muted-foreground uppercase tracking-widest">
              <span>Product</span>
              <span className="text-center w-24">Quantity</span>
              <span className="text-right w-24">Subtotal</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-border/50 px-6">
              {items.map((item) => (
                <CartPageItem
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

// ── Wider cart-page variant of CartItem ──────────────────────────────────────
// Reuses CartItem but in a richer grid layout for the full page view.
import { StoreCartLineItem } from "@medusajs/types"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useTransition } from "react"
import { removeLineItem, updateLineItem } from "@/lib/data/cart"

function CartPageItem({
  item,
  cartId,
  currencyCode,
}: {
  item: StoreCartLineItem
  cartId: string
  currencyCode: string
}) {
  const store = useCartStore((s) => ({
    setLoading: s.setLoading,
    updateCartFromServer: s.updateCartFromServer,
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

  const handleQty = (qty: number) =>
    startTransition(async () => {
      store.setLoading(true)
      try {
        store.updateCartFromServer(
          await updateLineItem({ cartId, lineItemId: item.id, quantity: qty })
        )
      } finally {
        store.setLoading(false)
      }
    })

  const handleRemove = () =>
    startTransition(async () => {
      store.setLoading(true)
      try {
        store.updateCartFromServer(
          await removeLineItem({ cartId, lineItemId: item.id })
        )
      } finally {
        store.setLoading(false)
      }
    })

  return (
    <div
      className={cn(
        "py-4 flex gap-4 items-start",
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      {/* Thumbnail */}
      <div className="relative size-20 md:size-24 shrink-0 overflow-hidden rounded-md border border-border/50 bg-accent/30">
        {item.thumbnail ? (
          <Image
            unoptimized
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs">
            No img
          </div>
        )}
      </div>

      {/* Middle: title + price */}
      <div className="flex flex-1 min-w-0 flex-col gap-1">
        <p className="text-sm font-semibold leading-snug line-clamp-2">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground">{item.subtitle}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">{unitPrice} each</p>

        {/* Quantity controls — always visible */}
        <div className="flex items-center gap-1.5 mt-3">
          <Button
            variant="outline"
            size="icon"
            className="size-7 rounded-none"
            onClick={() => handleQty(item.quantity - 1)}
            disabled={isPending || item.quantity <= 1}
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-7 rounded-none"
            onClick={() => handleQty(item.quantity + 1)}
            disabled={isPending}
          >
            <Plus className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 ml-1 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            disabled={isPending}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Subtotal — right-aligned, hidden on mobile (shown below) */}
      <div className="hidden md:flex shrink-0 w-24 justify-end">
        <span className="text-sm font-semibold tabular-nums">{subtotal}</span>
      </div>
    </div>
  )
}
