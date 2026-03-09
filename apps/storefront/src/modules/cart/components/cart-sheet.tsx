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
import { convertToLocale } from "@/lib/util/product"
import { useCart } from "@/modules/cart/hooks/use-cart"
import CartItem from "./cart-item"
import Link from "next/link"

export default function CartList() {
  const { cart } = useCart()

  const items = cart?.items ?? []
  const hasItems = items.length > 0
  const currencyCode = cart?.currency_code ?? "usd"

  const subtotal = convertToLocale({
    amount: cart?.subtotal ?? 0,
    currency_code: currencyCode,
  })

  if (!hasItems) {
    return (
      <Empty className="pt-8">
        <EmptyHeader>
          <EmptyMedia>
            <EmptyShoppingCartIcon className="size-16" />
          </EmptyMedia>
          <EmptyTitle className="text-muted-foreground">
            No products in the cart.
          </EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/categories">Return to Shop</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Items list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/50 px-4">
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            cartId={cart!.id}
            currencyCode={currencyCode}
          />
        ))}
      </div>

      {/* Footer: subtotal + checkout */}
      <div className="pt-4 space-y-3">
        <Separator />
        <div className="flex justify-between items-center text-sm font-medium px-4">
          <span>Subtotal</span>
          <span className="text-base font-bold tabular-nums">{subtotal}</span>
        </div>
        <Button className="w-full rounded-none font-semibold tracking-widest uppercase text-xs">
          Proceed to Checkout
        </Button>
      </div>
    </div>
  )
}
