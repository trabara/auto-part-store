import { redirect } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import { retrieveCart } from "@/lib/data/cart"
import { CheckoutTemplate } from "@/modules/checkout/templates/checkout-template"
import { Metadata } from "next"
import { hasLocale } from "next-intl"

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

  const cart = await retrieveCart()

  if (!cart || !cart.items?.length) {
    redirect({ href: "/cart", locale })
  }

  return <CheckoutTemplate initialCart={cart!} />
}
