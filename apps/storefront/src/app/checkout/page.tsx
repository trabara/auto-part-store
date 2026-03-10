import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCartId } from "@/lib/data/cookies"
import { retrieveCart } from "@/lib/data/cart"
import { CheckoutTemplate } from "@/modules/checkout/templates/checkout-template"

export const metadata: Metadata = {
  title: "Checkout | SnapStore",
  description: "Complete your purchase securely.",
}

export default async function CheckoutPage() {
  const cartId = await getCartId().catch(() => undefined)

  if (!cartId) {
    redirect("/cart")
  }

  const cart = await retrieveCart(cartId)

  if (!cart || !cart.items?.length) {
    redirect("/cart")
  }

  return <CheckoutTemplate initialCart={cart} />
}
