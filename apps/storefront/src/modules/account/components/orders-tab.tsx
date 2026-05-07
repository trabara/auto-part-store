'use client'

import { getInvoice } from "@/lib/data/order"
import { convertToLocale } from "@/lib/util/product"
import type { StoreOrder } from "@medusajs/types"
import { useTranslations } from "next-intl"

type OrdersTabProps = {
  orders: StoreOrder[]
}

export function OrdersTab({ orders }: OrdersTabProps) {
  const t = useTranslations("account")

  if (!orders.length) {
    return <p className="text-sm text-muted-foreground py-6">{t("noOrders")}</p>
  }

  const downloadInvoice = async (orderId: string) => {
    const blob = await getInvoice(orderId)
    if (blob) {
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `invoice-${orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="divide-y">
      {orders.map((order) => {
        console.log("order", order)
        const total = convertToLocale({
          amount: order.total ?? 0,
          currency_code: order.currency_code ?? "usd",
        })

        return (
          <div
            key={order.id}
            className="py-4 flex items-center justify-between gap-4"
            onClick={() => downloadInvoice(order.id)}
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
