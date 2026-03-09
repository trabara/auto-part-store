import { Metadata } from "next"
import { getCartId } from "@/lib/data/cookies"
import { retrieveCart } from "@/lib/data/cart"
import { CartPageTemplate } from "@/modules/cart/templates/cart-page-template"

export const metadata: Metadata = {
  title: "Shopping Cart | SnapStore",
  description: "Review your cart and proceed to checkout.",
}

export default async function CartPage() {
  const cartId = await getCartId().catch(() => undefined)
  const initialCart = cartId ? await retrieveCart(cartId) : null

  return <CartPageTemplate initialCart={initialCart} />
}
