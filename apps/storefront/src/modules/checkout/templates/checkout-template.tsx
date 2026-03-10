"use client"

import { useState } from "react"
import { StoreCart } from "@medusajs/types"
import { ContactSection } from "@/modules/checkout/components/contact-section"
import { ShippingAddressSection } from "@/modules/checkout/components/shipping-address-section"
import { ShippingMethodSection } from "@/modules/checkout/components/shipping-method-section"
import { PaymentSection } from "@/modules/checkout/components/payment-section"
import { OrderReviewSection } from "@/modules/checkout/components/order-review-section"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

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

  return (
    <div className="min-h-screen bg-background">
      <div className="snap-container py-8 md:py-12">
        {/* Back to cart */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="size-4" />
          Back to cart
        </Link>

        <h1 className="text-2xl font-bold tracking-tight mb-8">Checkout</h1>

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
            onSaved={() => setShippingDone(true)}
            disabled={!addressDone}
          />

          {/* Step 4: Payment */}
          <PaymentSection
            cart={initialCart}
            onSaved={() => setPaymentDone(true)}
            disabled={!shippingDone}
          />

          {/* Step 5: Review & Place Order */}
          <OrderReviewSection cart={initialCart} disabled={!paymentDone} />
        </div>
      </div>
    </div>
  )
}
