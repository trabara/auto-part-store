import type { StoreOrder } from "@medusajs/types"
import { convertToLocale } from "@/lib/util/product"
import { useTranslations } from "next-intl"

type Props = {
  orders: StoreOrder[]
}

export function OrdersTab({ orders }: Props) {
  const t = useTranslations("account")

  if (!orders.length) {
    return <p className="text-sm text-muted-foreground py-6">{t("noOrders")}</p>
  }

  return (
    <div className="divide-y">
      {orders.map((order) => {
        const total = convertToLocale({
          amount: order.total ?? 0,
          currency_code: order.currency_code ?? "usd",
        })

        return (
          <div
            key={order.id}
            className="py-4 flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm font-medium">#{order.display_id}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at!).toLocaleDateString()}
                {" · "}
                {order.items?.length ?? 0} {t("itemsCount")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold">{total}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                {order.status}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
