"use client"

import { useState } from "react"
import { StoreCart } from "@medusajs/types"
import { ContactSection } from "@/modules/checkout/components/contact-section"
import { ShippingAddressSection } from "@/modules/checkout/components/shipping-address-section"
import { ShippingMethodSection } from "@/modules/checkout/components/shipping-method-section"
import { PaymentSection } from "@/modules/checkout/components/payment-section"
import { OrderReviewSection } from "@/modules/checkout/components/order-review-section"
import { Link } from "@/i18n/navigation"
import { ChevronLeft } from "lucide-react"
import { useTranslations } from "next-intl"

type Props = {
  initialCart: StoreCart
}

export function CheckoutTemplate({ initialCart }: Props) {
  // Progression state — each step unlocks the next.
  // We do NOT subscribe to the Zustand cart here to avoid re-renders that
  // could interfere with child section state (saved/editing toggles).
  const [contactDone, setContactDone] = useState(!!initialCart.email)
  const [addressDone, setAddressDone] = useState(
    !!(
      initialCart.shipping_address?.first_name &&
      initialCart.shipping_address?.address_1
    )
  )
  const [shippingDone, setShippingDone] = useState(
    !!initialCart.shipping_methods?.length
  )
  const [paymentDone, setPaymentDone] = useState(
    !!(initialCart.payment_collection as any)?.payment_sessions?.length
  )

  // Latest cart for the Review section — updated when shipping or payment is saved
  // so totals always reflect the most recent server state.
  const [reviewCart, setReviewCart] = useState<StoreCart>(initialCart)

  const t = useTranslations("checkout")

  return (
    <div className="min-h-screen bg-background">
      <div className="snap-container py-8 md:py-12">
        {/* Back to cart */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="size-4" />
          {t("backToCart")}
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-8 ">{t("title")}</h1>

        <div className="grid grid-cols-1 gap-4 max-w-2xl">
          {/* Step 1: Contact */}
          <ContactSection
            initialEmail={initialCart.email ?? ""}
            onSaved={() => setContactDone(true)}
          />

          {/* Step 2: Shipping Address */}
          <ShippingAddressSection
            initialAddress={initialCart.shipping_address ?? null}
            onSaved={() => setAddressDone(true)}
            disabled={!contactDone}
          />

          {/* Step 3: Shipping Method */}
          <ShippingMethodSection
            cart={initialCart}
            onSaved={(updatedCart) => {
              setShippingDone(true)
              setReviewCart(updatedCart)
            }}
            disabled={!addressDone}
          />

          {/* Step 4: Payment */}
          <PaymentSection
            cart={initialCart}
            onSaved={(updatedCart) => {
              setPaymentDone(true)
              setReviewCart(updatedCart)
            }}
            disabled={!shippingDone}
          />

          {/* Step 5: Review & Place Order */}
          <OrderReviewSection cart={reviewCart} disabled={!paymentDone} />
        </div>
      </div>
    </div>
  )
}
