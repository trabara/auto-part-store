"use client"

import { HttpTypes } from "@medusajs/types"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"
import { useState } from "react"

type VariantSelectorProps = {
  product: HttpTypes.StoreProduct
  onVariantChange: (variantId: string | undefined) => void
}

// Map of option id → selected value string
type OptionSelection = Record<string, string>

/**
 * Build a selection map keyed by option *id* (not title).
 * Picks the first value for every product option.
 */
function buildInitialSelection(
  product: HttpTypes.StoreProduct
): OptionSelection {
  const sel: OptionSelection = {}
  const variants = product.variants ?? []
  const firstVariant =
    variants.find((v) => v.calculated_price) ?? variants[0]
  firstVariant?.options?.forEach((opt) => {
    const optionId = opt.option_id as string | undefined
    if (optionId && opt.value) {
      sel[optionId] = opt.value
    }
  })
  return sel
}
/**
 * Given variants and a selection keyed by option id,
 * find the variant whose options all match the selection.
 *
 * Variant option shape from Medusa store API:
 *   { option_id: string, value: string }
 */
function findVariant(
  variants: HttpTypes.StoreProductVariant[],
  selection: OptionSelection
): HttpTypes.StoreProductVariant | undefined {
  const optionIds = Object.keys(selection)
  if (optionIds.length === 0) return undefined

  const variant = variants.find((variant) => {
    if (!variant.options) return false
    return optionIds.every((optionId) => {
      const opt = variant.options!.find(
        (o) => o.option_id === optionId
      )
      return opt?.value === selection[optionId]
    })
  })

  return variant ?? variants[0]
}

export function VariantSelector({
  product,
  onVariantChange,
}: VariantSelectorProps) {
  const variants = product.variants ?? []
  const options = product.options ?? []
  const [selection, setSelection] = useState<OptionSelection>(() =>
    buildInitialSelection(product)
  )

  const handleSelect = (optionId: string, value: string) => {
    const newSelection = { ...selection, [optionId]: value }
    setSelection(newSelection)
    const matched = findVariant(variants, newSelection)
    onVariantChange(matched?.id)
  }

  if (options.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {options.map((option) => {
        if (!option.id || !option.title || !option.values?.length) return null
        const currentValue = selection[option.id]
        const values = option.values.filter((val) =>
          variants.some((variant) =>
            variant.options?.some(
              (opt) => opt.option_id === option.id && opt.value === val.value
            )
          )
        )
        return (
          <div key={option.id} className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              {option.title}
              {currentValue && (
                <span className="ml-2 font-normal text-muted-foreground">
                  {currentValue}
                </span>
              )}
            </span>
            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                const isSelected = currentValue === val.value
                return (
                  <Button
                    key={val.id}
                    onClick={() => handleSelect(option.id!, val.value)}
                    className={cn(
                      {
                        "bg-accent text-primary hover:bg-accent": isSelected,
                      }
                    )}
                  >
                    {val.value}
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
