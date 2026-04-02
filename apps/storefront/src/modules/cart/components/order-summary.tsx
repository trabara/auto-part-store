"use client"

import { useCart } from "@/modules/cart/hooks/use-cart"
import { convertToLocale } from "@/lib/util/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Tag, Truck, Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useState } from "react"

type SummaryRowProps = {
  label: string
  value: string
  hint?: string
  className?: string
  bold?: boolean
}

function SummaryRow({ label, value, hint, className, bold }: SummaryRowProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <span
        className={cn(
          "text-sm text-muted-foreground",
          bold && "text-foreground font-semibold"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-sm tabular-nums text-right shrink-0",
          bold && "text-base font-bold text-foreground",
          hint && "text-muted-foreground italic"
        )}
      >
        {hint ?? value}
      </span>
    </div>
  )
}

export function OrderSummary() {
  const { cart } = useCart()
  const t = useTranslations("cart")
  const [coupon, setCoupon] = useState("")

  if (!cart) return null

  const currency = cart.currency_code ?? "usd"

  const fmt = (amount: number | null | undefined) =>
    convertToLocale({ amount: amount ?? 0, currency_code: currency })

  const subtotal = fmt(cart.subtotal)
  const taxTotal = cart.tax_total ?? 0
  const shippingTotal = cart.shipping_total ?? 0
  const discountTotal = cart.discount_total ?? 0
  const total = fmt(cart.total)

  const hasDiscount = discountTotal > 0
  const hasShipping = shippingTotal > 0
  const hasTax = taxTotal > 0

  return (
    <div className="bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-accent/30">
        <h2 className="text-base font-semibold tracking-tight">
          {t("orderSummary")}
        </h2>
      </div>

      <div className="px-6 py-5 space-y-3">
        {/* Subtotal */}
        <SummaryRow label={t("subtotal")} value={subtotal} />

        {/* Discount */}
        {hasDiscount && (
          <SummaryRow
            label={t("discount")}
            value={`-${fmt(discountTotal)}`}
            className="text-green-600"
          />
        )}

        {/* Shipping */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Truck className="size-3.5 shrink-0" />
            {t("shipping")}
          </span>
          <span
            className={cn(
              "text-sm tabular-nums text-right shrink-0",
              !hasShipping && "text-muted-foreground italic"
            )}
          >
            {hasShipping ? fmt(shippingTotal) : t("calculatedAtCheckout")}
          </span>
        </div>

        {/* Tax */}
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">{t("tax")}</span>
          <span
            className={cn(
              "text-sm tabular-nums text-right shrink-0",
              !hasTax && "text-muted-foreground italic"
            )}
          >
            {hasTax ? fmt(taxTotal) : t("calculatedAtCheckout")}
          </span>
        </div>

        <Separator />

        {/* Order Total */}
        <SummaryRow label={t("orderTotal")} value={total} bold />
      </div>

      {/* Coupon */}
      <div className="px-6 pb-5 space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Tag className="size-3.5 shrink-0" />
          {t("couponLabel")}
        </p>
        <div className="flex gap-2">
          <Input
            placeholder={t("couponPlaceholder")}
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="h-9 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 h-9 px-4 text-xs font-semibold tracking-widest uppercase"
            disabled={!coupon.trim()}
          >
            {t("couponApply")}
          </Button>
        </div>
        {/* <p className="text-xs text-muted-foreground/60">{t("couponNote")}</p> */}
      </div>

      <Separator />

      {/* Checkout CTA */}
      <div className="px-6 py-5 space-y-3">
        <Button
          className="w-full font-semibold tracking-widest uppercase text-xs h-11 gap-2"
          asChild
        >
          <Link href="/checkout">
            <Lock className="size-3.5" />
            {t("proceedToCheckout")}
          </Link>
        </Button>
        {/* <p className="text-center text-xs text-muted-foreground">
          {t("secureCheckout")}
        </p> */}
      </div>
    </div>
  )
}
