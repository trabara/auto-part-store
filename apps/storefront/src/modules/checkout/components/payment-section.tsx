"use client"

import { useState, useTransition } from "react"
import { useCartStore } from "@/modules/cart/hooks/use-cart"
import { initiatePayment } from "@/lib/data/checkout"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle2, CreditCard, Pencil } from "lucide-react"
import { StoreCart } from "@medusajs/types"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

type Props = {
  cart: StoreCart
  onSaved: (updatedCart: StoreCart) => void
  disabled?: boolean
}

export function PaymentSection({ cart, onSaved, disabled }: Props) {
  const store = useCartStore((s) => ({
    updateCartFromServer: s.updateCartFromServer,
  }))

  const t = useTranslations("checkout")

  const PAYMENT_PROVIDERS = [
    {
      id: "pp_system_default",
      label: t("payment.payOnDelivery"),
      description: t("payment.payOnDeliveryDesc"),
    },
  ]

  const existingProvider =
    (cart.payment_collection?.payment_sessions as any[])?.[0]?.provider_id ?? ""

  const [selected, setSelected] = useState(
    existingProvider || "pp_system_default"
  )
  const [saved, setSaved] = useState(!!existingProvider)
  const [editing, setEditing] = useState(!existingProvider)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    if (!selected) {
      setError(t("payment.selectError"))
      return
    }
    setError(null)

    startTransition(async () => {
      try {
        const updatedCart = await initiatePayment(selected)
        setSaved(true)
        setEditing(false)
        onSaved(updatedCart as StoreCart)
        // Update global cart store after UI state is committed
        store.updateCartFromServer(updatedCart as StoreCart)
      } catch (e: any) {
        setError(e?.message ?? t("payment.saveError"))
      }
    })
  }

  const selectedProvider = PAYMENT_PROVIDERS.find((p) => p.id === selected)

  return (
    <section
      className={
        "bg-card border border-border overflow-hidden" +
        (disabled ? " opacity-50 pointer-events-none" : "")
      }
    >
      <div className="px-6 py-4 border-b border-border bg-accent/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {saved && !editing && (
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
          )}
          <h2 className="text-base font-semibold tracking-tight">
            {t("payment.title")}
          </h2>
        </div>
        {saved && !editing && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3" />
            {t("edit")}
          </button>
        )}
      </div>

      {!editing && saved && selectedProvider ? (
        <div className="px-6 py-4 flex items-center gap-3">
          <CreditCard className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">{selectedProvider.label}</p>
        </div>
      ) : (
        <div className="px-6 py-5 space-y-4">
          <RadioGroup
            value={selected}
            onValueChange={(val) => {
              setSelected(val)
              setSaved(false)
            }}
          >
            {PAYMENT_PROVIDERS.map((provider) => (
              <label
                key={provider.id}
                htmlFor={`payment-${provider.id}`}
                className={cn("flex items-center gap-4 border px-4 py-3 cursor-pointer transition-colors", {
                  "border-primary bg-primary/5": selected === provider.id,
                  "border-border hover:border-muted-foreground/40": selected !== provider.id,
                })}
              >
                <RadioGroupItem
                  value={provider.id}
                  id={`payment-${provider.id}`}
                />
                <div className="flex-1 flex items-center gap-3 rtl:flex-row-reverse">
                  <CreditCard className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{provider.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {provider.description}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </RadioGroup>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleSave}
            disabled={isPending || !selected}
            className="font-semibold tracking-widest uppercase text-xs h-9 px-6"
          >
            {isPending ? t("saving") : t("continue")}
          </Button>
        </div>
      )}
    </section>
  )
}
