"use client"

import { useEffect, useState, useTransition } from "react"
import { useCartStore } from "@/modules/cart/hooks/use-cart"
import { listShippingOptions, selectShippingMethod } from "@/lib/data/checkout"
import { Button } from "@repo/ui/components/button"
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group"
import { convertToLocale } from "@/lib/util/product"
import { CheckCircle2, Loader2, Pencil, Truck } from "lucide-react"
import { HttpTypes, StoreCart } from "@medusajs/types"

type Props = {
  cart: StoreCart
  onSaved: (updatedCart: StoreCart) => void
  disabled?: boolean
}

export function ShippingMethodSection({ cart, onSaved, disabled }: Props) {
  const store = useCartStore((s) => ({
    updateCartFromServer: s.updateCartFromServer,
  }))

  const [options, setOptions] = useState<HttpTypes.StoreCartShippingOption[]>(
    []
  )
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>(
    (cart.shipping_methods?.[0] as any)?.shipping_option_id ?? ""
  )
  const [saved, setSaved] = useState(!!cart.shipping_methods?.length)
  const [editing, setEditing] = useState(!cart.shipping_methods?.length)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currency = cart.currency_code ?? "usd"

  useEffect(() => {
    listShippingOptions()
      .then(setOptions)
      .catch(() => setOptions([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = () => {
    if (!selected) {
      setError("Please select a shipping method.")
      return
    }
    setError(null)

    startTransition(async () => {
      try {
        const updatedCart = await selectShippingMethod(selected)
        setSaved(true)
        setEditing(false)
        onSaved(updatedCart as StoreCart)
        // Update global cart store after UI state is committed
        store.updateCartFromServer(updatedCart as StoreCart)
      } catch (e: any) {
        setError(e?.message ?? "Failed to select shipping method.")
      }
    })
  }

  const selectedOption = options.find((o) => o.id === selected)

  // Collapsed summary: show the selected option name + price
  const savedSummary = selectedOption
    ? {
        name: selectedOption.name,
        price:
          selectedOption.amount === 0
            ? "Free"
            : convertToLocale({
                amount: selectedOption.amount ?? 0,
                currency_code: currency,
              }),
      }
    : null

  return (
    <section
      className={
        "bg-card border border-border rounded-xl overflow-hidden" +
        (disabled ? " opacity-50 pointer-events-none" : "")
      }
    >
      <div className="px-6 py-4 border-b border-border bg-accent/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {saved && !editing && (
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
          )}
          <h2 className="text-base font-semibold tracking-tight">
            3. Shipping Method
          </h2>
        </div>
        {saved && !editing && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3" />
            Edit
          </button>
        )}
      </div>

      {!editing && saved && savedSummary ? (
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-muted-foreground shrink-0" />
            <p className="text-sm font-medium">{savedSummary.name}</p>
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {savedSummary.price}
          </span>
        </div>
      ) : (
        <div className="px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading shipping options…
            </div>
          ) : options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No shipping options available for your address.
            </p>
          ) : (
            <RadioGroup
              value={selected}
              onValueChange={(val) => {
                setSelected(val)
                setSaved(false)
              }}
            >
              {options.map((option) => {
                const price = convertToLocale({
                  amount: option.amount ?? 0,
                  currency_code: currency,
                })
                return (
                  <label
                    key={option.id}
                    htmlFor={`shipping-${option.id}`}
                    className={
                      "flex items-center justify-between gap-4 rounded-lg border px-4 py-3 cursor-pointer transition-colors " +
                      (selected === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value={option.id}
                        id={`shipping-${option.id}`}
                      />
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <Truck className="size-3.5 text-muted-foreground" />
                          {option.name}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {option.amount === 0 ? "Free" : price}
                    </span>
                  </label>
                )
              })}
            </RadioGroup>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && options.length > 0 && (
            <Button
              onClick={handleSave}
              disabled={isPending || !selected}
              className="font-semibold tracking-widest uppercase text-xs h-9 px-6"
            >
              {isPending ? "Saving…" : "Continue"}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
