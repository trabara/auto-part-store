"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/modules/cart/hooks/use-cart"
import { placeOrder } from "@/lib/data/checkout"
import { convertToLocale } from "@/lib/util/product"
import { getVariantLabel } from "@/modules/cart/components/cart-line-item"
import { Button } from "@repo/ui/components/button"
import { Separator } from "@repo/ui/components/separator"
import { ShieldCheck, Loader2 } from "lucide-react"
import Image from "next/image"
import { StoreCart } from "@medusajs/types"
import { useState } from "react"

type Props = {
  cart: StoreCart
  disabled?: boolean
}

export function OrderReviewSection({ cart, disabled }: Props) {
  const store = useCartStore((s) => ({ setCart: s.setCart }))
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currency = cart.currency_code ?? "usd"
  const fmt = (amount: number | null | undefined) =>
    convertToLocale({ amount: amount ?? 0, currency_code: currency })

  const items = cart.items ?? []
  const subtotal = fmt(cart.subtotal)
  const shippingTotal = cart.shipping_total ?? 0
  const taxTotal = cart.tax_total ?? 0
  const total = fmt(cart.total)

  const handlePlaceOrder = () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await placeOrder()
        if (result.type === "order") {
          store.setCart(null)
          router.push(`/order/${result.orderId}`)
        } else {
          setError(result.message)
        }
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong. Please try again.")
      }
    })
  }

  return (
    <section
      className={
        "bg-card border border-border rounded-xl overflow-hidden" +
        (disabled ? " opacity-50 pointer-events-none" : "")
      }
    >
      <div className="px-6 py-4 border-b border-border bg-accent/30">
        <h2 className="text-base font-semibold tracking-tight">
          5. Review &amp; Place Order
        </h2>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Line items */}
        <div className="space-y-3">
          {items.map((item) => {
            const variantLabel = getVariantLabel(item)
            const itemTotal = fmt(item.total)
            return (
              <div key={item.id} className="flex gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-sm border border-border/50 bg-accent/30">
                  {item.thumbnail ? (
                    <Image
                      unoptimized
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex flex-1 justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-2">
                      {item.title}
                    </p>
                    {variantLabel && (
                      <p className="text-xs text-muted-foreground">
                        {variantLabel}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {itemTotal}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="tabular-nums">
              {shippingTotal > 0 ? fmt(shippingTotal) : "Free"}
            </span>
          </div>
          {taxTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">{fmt(taxTotal)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-base tabular-nums">{total}</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Button
          onClick={handlePlaceOrder}
          disabled={isPending || disabled}
          className="w-full font-semibold tracking-widest uppercase text-xs h-11 gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Placing Order…
            </>
          ) : (
            <>
              <ShieldCheck className="size-3.5" />
              Place Order
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By placing your order you agree to our terms and conditions.
        </p>
      </div>
    </section>
  )
}
