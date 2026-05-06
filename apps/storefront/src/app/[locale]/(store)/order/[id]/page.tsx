import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrieveOrder } from "@/lib/data/checkout"
import { OrderConfirmationTemplate } from "@/modules/order/templates/order-confirmation-template"

export const metadata: Metadata = {
  title: "Order Confirmed | SnapStore",
  description: "Thank you for your order!",
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params
  const order = await retrieveOrder(id)

  if (!order) {
    notFound()
  }

  return <OrderConfirmationTemplate order={order} />
}
