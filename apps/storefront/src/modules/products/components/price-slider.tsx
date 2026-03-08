"use client"

import { Input } from "@repo/ui/components/input"
import { Slider } from "@repo/ui/components/slider"
import { cn } from "@repo/ui/lib/utils"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { useCallback, useState } from "react"

type PriceRangeSliderProps = React.ComponentProps<typeof SliderPrimitive.Root>

export default function PriceRangeSlider({
  className,
  defaultValue,
  onValueChange,
  ...props
}: PriceRangeSliderProps) {
  const minPrice = defaultValue?.[0] ? defaultValue[0] : 0
  const maxPrice = defaultValue?.[1] ? defaultValue[1] : 0

  const [value, setValue] = useState<[number, number]>([minPrice, maxPrice])

  const handleSliderChange = (values: number[]) => {
    const min = values[0] ?? 0
    const max = values[1] ?? 0
    setValue([min, max])
    onValueChange?.(values)
  }

  const handleInputChange = useCallback(
    (index: 0 | 1, newValue: number) => {
      setValue((prev) => {
        const newValues: [number, number] = [...prev] as [number, number]
        newValues[index] = newValue
        onValueChange?.(newValues)
        return newValues
      })
    },
    [onValueChange]
  )

  const step = maxPrice > minPrice ? (maxPrice - minPrice) / 100 : 1

  return (
    <div className={cn(className, "space-y-4")}>
      <Slider
        onValueChange={handleSliderChange}
        value={value}
        step={step}
        min={minPrice}
        max={maxPrice}
        aria-label="Price Range"
      />
      <div className="flex gap-4">
        <Input
          type="number"
          placeholder="min"
          value={value[0]}
          min={minPrice}
          max={value[1]}
          onChange={(e) => handleInputChange(0, Number(e.target.value))}
        />
        <span className="mx-2 mt-2">-</span>
        <Input
          type="number"
          placeholder="max"
          max={maxPrice}
          min={value[0]}
          value={value[1]}
          onChange={(e) => handleInputChange(1, Number(e.target.value))}
        />
      </div>
    </div>
  )
}
