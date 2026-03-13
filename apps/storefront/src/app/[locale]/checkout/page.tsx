import { Metadata } from "next"
import { redirect } from "@/i18n/navigation"
import { getCartId } from "@/lib/data/cookies"
import { retrieveCart } from "@/lib/data/cart"
import { CheckoutTemplate } from "@/modules/checkout/templates/checkout-template"
import { hasLocale } from "next-intl"
import { routing } from "@/i18n/routing"

export const metadata: Metadata = {
  title: "Checkout | SnapStore",
  description: "Complete your purchase securely.",
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    redirect({ href: "/", locale: routing.defaultLocale })
  }

  const cartId = await getCartId().catch(() => undefined)

  if (!cartId) {
    redirect({ href: "/cart", locale })
  }

  const cart = await retrieveCart(cartId!)

  if (!cart || !cart.items?.length) {
    redirect({ href: "/cart", locale })
  }

  return <CheckoutTemplate initialCart={cart!} />
}
