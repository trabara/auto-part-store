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
import { SheetClose } from "@repo/ui/components/sheet"
import { Separator } from "@repo/ui/components/separator"
import { convertToLocale } from "@/lib/util/product"
import { useCart } from "@/modules/cart/hooks/use-cart"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import CartLineItem from "./cart-line-item"

type CartListProps = {
  className?: string
}

export default function CartList({ className }: CartListProps) {
  const { cart } = useCart()
  const t = useTranslations("cart")

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
            {t("empty")}
          </EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <SheetClose asChild>
            <Button asChild>
              <Link href="/categories">{t("returnToShop")}</Link>
            </Button>
          </SheetClose>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Items list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/50 px-4">
        {items.map((item) => (
          <CartLineItem
            key={item.id}
            item={item}
            cartId={cart!.id}
            currencyCode={currencyCode}
          />
        ))}
      </div>

      {/* Footer: subtotal + checkout */}
      <div className="flex-shrink-0 space-y-3 bg-background border-t border-border">
        <div className="pt-4 px-4 flex justify-between items-center text-sm font-medium">
          <span>{t("subtotal")}</span>
          <span className="text-base font-bold tabular-nums">{subtotal}</span>
        </div>
        <SheetClose asChild>
          <Button
            className="w-full font-semibold tracking-widest uppercase text-xs"
            asChild
          >
            <Link href="/cart">{t("viewCartCheckout")}</Link>
          </Button>
        </SheetClose>
      </div>
    </div>
  )
}
