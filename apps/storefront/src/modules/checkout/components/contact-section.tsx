"use client"

import { useState, useTransition } from "react"
import { useCartStore } from "@/modules/cart/hooks/use-cart"
import { updateCartContact } from "@/lib/data/checkout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { CheckCircle2, Pencil } from "lucide-react"
import { StoreCart } from "@medusajs/types"
import { useTranslations } from "next-intl"

type Props = {
  initialEmail?: string
  onSaved: (email: string) => void
}

export function ContactSection({ initialEmail, onSaved }: Props) {
  const store = useCartStore((s) => ({
    updateCartFromServer: s.updateCartFromServer,
  }))

  const [email, setEmail] = useState(initialEmail ?? "")
  const [saved, setSaved] = useState(!!initialEmail)
  const [editing, setEditing] = useState(!initialEmail)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const t = useTranslations("checkout")

  const handleSave = () => {
    if (!email.trim() || !email.includes("@")) {
      setError(t("contact.emailError"))
      return
    }
    setError(null)

    startTransition(async () => {
      try {
        const updatedCart = await updateCartContact(email.trim())
        setSaved(true)
        setEditing(false)
        onSaved(email.trim())
        // Update global cart store after UI state is committed
        store.updateCartFromServer(updatedCart as StoreCart)
      } catch (e: any) {
        setError(e?.message ?? t("contact.saveError"))
      }
    })
  }

  return (
    <section className="bg-card border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-accent/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {saved && !editing && (
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
          )}
          <h2 className="text-base font-semibold tracking-tight">
            {t("contact.title")}
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
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {t("contact.emailLabel")}
          </p>
          <p className="text-sm font-medium mt-0.5">{email}</p>
        </div>
      ) : (
        <div className="px-6 py-5 space-y-4">
          <Field>
            <FieldLabel htmlFor="checkout-email">
              {t("contact.emailField")}
            </FieldLabel>
            <Input
              id="checkout-email"
              type="email"
              placeholder={t("contact.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              disabled={isPending}
              autoComplete="email"
              className="h-10"
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <Button
            onClick={handleSave}
            disabled={isPending || !email.trim()}
            className="font-semibold tracking-widest uppercase text-xs h-9 px-6"
          >
            {isPending ? t("saving") : t("continue")}
          </Button>
        </div>
      )}
    </section>
  )
}
