import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@/lib/util/product"
import { Separator } from "@repo/ui/components/separator"
import { Button } from "@repo/ui/components/button"
import { CheckCircle2, Package, MapPin, Truck } from "lucide-react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import InvoiceButton from "../components/invoice-button"

type Props = {
  order: HttpTypes.StoreOrder
}

export async function OrderConfirmationTemplate({ order }: Props) {
  const t = await getTranslations("order")
  const currency = order.currency_code ?? "usd"
  const fmt = (amount: number | null | undefined) =>
    convertToLocale({ amount: amount ?? 0, currency_code: currency })

  const items = order.items ?? []
  const address = order.shipping_address
  const shippingMethod = (order.shipping_methods as any[])?.[0]
  const shippingName =
    shippingMethod?.shipping_option?.name ??
    shippingMethod?.name ??
    t("standardShipping")

  return (
    <div className="min-h-screen bg-background">
      <div className="snap-container py-8 md:py-12 max-w-2xl">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {t("confirmed")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("thankYou")}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("orderNumber")}{" "}
            <span className="font-mono font-medium text-foreground">
              #{order.display_id ?? order.id.slice(-8).toUpperCase()}
            </span>
          </p>

          <InvoiceButton order={order} />
        </div>

        <div className="space-y-4">
          {/* Items */}
          <section className="bg-card border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-accent/30 flex items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold tracking-tight">
                {t("itemsOrdered")}
              </h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden border border-border/50 bg-accent/30">
                    {item.thumbnail ? (
                      <Image
                        unoptimized
                        src={item.thumbnail}
                        alt={item.title ?? ""}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs">
                        {t("noImg")}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("qty")} {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {fmt(item.total)}
                    </span>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Totals */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span className="tabular-nums">{fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("shipping")}</span>
                  <span className="tabular-nums">
                    {(order.shipping_total ?? 0) > 0
                      ? fmt(order.shipping_total)
                      : t("free")}
                  </span>
                </div>
                {(order.tax_total ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("tax")}</span>
                    <span className="tabular-nums">{fmt(order.tax_total)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">{t("total")}</span>
                  <span className="font-bold text-base tabular-nums">
                    {fmt(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Shipping details */}
          {address && (
            <section className="bg-card border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-accent/30 flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold tracking-tight">
                  {t("shippingAddress")}
                </h2>
              </div>
              <div className="px-6 py-4 space-y-0.5">
                <p className="text-sm font-medium">
                  {address.first_name} {address.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.address_1}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.postal_code}
                </p>
                {address.phone && (
                  <p className="text-sm text-muted-foreground">
                    {address.phone}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Shipping method */}
          {shippingMethod && (
            <section className="bg-card border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-accent/30 flex items-center gap-2">
                <Truck className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold tracking-tight">
                  {t("deliveryMethod")}
                </h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm font-medium">{shippingName}</p>
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              asChild
              className="flex-1 font-semibold tracking-widest uppercase text-xs h-10"
            >
              <Link href="/">{t("continueShopping")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
