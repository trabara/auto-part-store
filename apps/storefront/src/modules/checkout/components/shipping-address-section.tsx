"use client"

import { useState, useTransition } from "react"
import { useCartStore } from "@/modules/cart/hooks/use-cart"
import { updateCartAddress } from "@/lib/data/checkout"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Field, FieldLabel, FieldError } from "@repo/ui/components/field"
import { CheckCircle2, Pencil } from "lucide-react"
import { HttpTypes, StoreCart } from "@medusajs/types"
import { useTranslations } from "next-intl"

type AddressForm = {
  first_name: string
  last_name: string
  address_1: string
  city: string
  postal_code: string
  country_code: string
  phone: string
}

const EMPTY_FORM: AddressForm = {
  first_name: "",
  last_name: "",
  address_1: "",
  city: "",
  postal_code: "",
  country_code: "tn",
  phone: "",
}

type Props = {
  initialAddress?: HttpTypes.StoreCartAddress | null
  onSaved: (address: AddressForm) => void
  disabled?: boolean
}

export function ShippingAddressSection({
  initialAddress,
  onSaved,
  disabled,
}: Props) {
  const store = useCartStore((s) => ({
    updateCartFromServer: s.updateCartFromServer,
  }))

  const fromInitial = (): AddressForm => ({
    first_name: initialAddress?.first_name ?? "",
    last_name: initialAddress?.last_name ?? "",
    address_1: initialAddress?.address_1 ?? "",
    city: initialAddress?.city ?? "",
    postal_code: initialAddress?.postal_code ?? "",
    country_code: initialAddress?.country_code ?? "tn",
    phone: initialAddress?.phone ?? "",
  })

  const isComplete = (addr: HttpTypes.StoreCartAddress | null | undefined) =>
    !!(addr?.first_name && addr?.last_name && addr?.address_1 && addr?.city)

  const [form, setForm] = useState<AddressForm>(fromInitial)
  const [saved, setSaved] = useState(isComplete(initialAddress))
  const [editing, setEditing] = useState(!isComplete(initialAddress))
  const [errors, setErrors] = useState<Partial<AddressForm>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const t = useTranslations("checkout")

  const set =
    (key: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const validate = (): boolean => {
    const e: Partial<AddressForm> = {}
    if (!form.first_name.trim()) e.first_name = t("shippingAddress.required")
    if (!form.last_name.trim()) e.last_name = t("shippingAddress.required")
    if (!form.address_1.trim()) e.address_1 = t("shippingAddress.required")
    if (!form.city.trim()) e.city = t("shippingAddress.required")
    if (!form.postal_code.trim()) e.postal_code = t("shippingAddress.required")
    if (!form.phone.trim()) e.phone = t("shippingAddress.required")
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    setServerError(null)

    startTransition(async () => {
      try {
        const updatedCart = await updateCartAddress(form)
        setSaved(true)
        setEditing(false)
        onSaved(form)
        // Update global cart store after UI state is committed
        store.updateCartFromServer(updatedCart as StoreCart)
      } catch (e: any) {
        setServerError(e?.message ?? t("shippingAddress.saveError"))
      }
    })
  }

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
            {t("shippingAddress.title")}
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

      {!editing && saved ? (
        <div className="px-6 py-4 space-y-0.5">
          <p className="text-sm font-medium">
            {form.first_name} {form.last_name}
          </p>
          <p className="text-sm text-muted-foreground">{form.address_1}</p>
          <p className="text-sm text-muted-foreground">
            {form.city}, {form.postal_code}
          </p>
          <p className="text-sm text-muted-foreground uppercase">
            {form.country_code}
          </p>
          {form.phone && (
            <p className="text-sm text-muted-foreground">{form.phone}</p>
          )}
        </div>
      ) : (
        <div className="px-6 py-5 space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="addr-first-name">
                {t("shippingAddress.firstName")}
              </FieldLabel>
              <Input
                id="addr-first-name"
                value={form.first_name}
                onChange={set("first_name")}
                disabled={isPending}
                autoComplete="given-name"
                className="h-10"
              />
              {errors.first_name && (
                <FieldError>{errors.first_name}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="addr-last-name">
                {t("shippingAddress.lastName")}
              </FieldLabel>
              <Input
                id="addr-last-name"
                value={form.last_name}
                onChange={set("last_name")}
                disabled={isPending}
                autoComplete="family-name"
                className="h-10"
              />
              {errors.last_name && <FieldError>{errors.last_name}</FieldError>}
            </Field>
          </div>

          {/* Address */}
          <Field>
            <FieldLabel htmlFor="addr-address1">
              {t("shippingAddress.address")}
            </FieldLabel>
            <Input
              id="addr-address1"
              value={form.address_1}
              onChange={set("address_1")}
              disabled={isPending}
              autoComplete="address-line1"
              placeholder={t("shippingAddress.addressPlaceholder")}
              className="h-10"
            />
            {errors.address_1 && <FieldError>{errors.address_1}</FieldError>}
          </Field>

          {/* City + Postal */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="addr-city">
                {t("shippingAddress.city")}
              </FieldLabel>
              <Input
                id="addr-city"
                value={form.city}
                onChange={set("city")}
                disabled={isPending}
                autoComplete="address-level2"
                className="h-10"
              />
              {errors.city && <FieldError>{errors.city}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="addr-postal">
                {t("shippingAddress.postalCode")}
              </FieldLabel>
              <Input
                id="addr-postal"
                value={form.postal_code}
                onChange={set("postal_code")}
                disabled={isPending}
                autoComplete="postal-code"
                className="h-10"
              />
              {errors.postal_code && (
                <FieldError>{errors.postal_code}</FieldError>
              )}
            </Field>
          </div>

          {/* Country (fixed to Tunisia) */}
          <Field>
            <FieldLabel htmlFor="addr-country">
              {t("shippingAddress.country")}
            </FieldLabel>
            <Input
              id="addr-country"
              value={t("shippingAddress.countryValue")}
              disabled
              className="h-10 bg-muted/50"
            />
          </Field>

          {/* Phone */}
          <Field>
            <FieldLabel htmlFor="addr-phone">
              {t("shippingAddress.phone")}
            </FieldLabel>
            <Input
              id="addr-phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              disabled={isPending}
              autoComplete="tel"
              placeholder={t("shippingAddress.phonePlaceholder")}
              className="h-10"
            />
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
          </Field>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button
            onClick={handleSave}
            disabled={isPending}
            className="font-semibold tracking-widest uppercase text-xs h-9 px-6"
          >
            {isPending ? t("saving") : t("continue")}
          </Button>
        </div>
      )}
    </section>
  )
}
