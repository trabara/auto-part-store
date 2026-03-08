"use client"

import { Input } from "@repo/ui/components/input"
import { Slider } from "@repo/ui/components/slider"
import { cn } from "@repo/ui/lib/utils"
import { useCallback, useState } from "react"

type PriceRangeSliderProps = {
  /** Absolute minimum price across all products — sets the slider lower bound */
  min: number
  /** Absolute maximum price across all products — sets the slider upper bound */
  max: number
  /** Current active filter minimum (defaults to min if not provided) */
  initialMin?: number
  /** Current active filter maximum (defaults to max if not provided) */
  initialMax?: number
  className?: string
  onValueChange?: (values: number[]) => void
}

export default function PriceRangeSlider({
  className,
  min,
  max,
  initialMin,
  initialMax,
  onValueChange,
}: PriceRangeSliderProps) {
  const effectiveMin = initialMin ?? min
  const effectiveMax = initialMax ?? max

  const [value, setValue] = useState<[number, number]>([
    effectiveMin,
    effectiveMax,
  ])

  const handleSliderChange = (values: number[]) => {
    const lo = values[0] ?? min
    const hi = values[1] ?? max
    setValue([lo, hi])
    onValueChange?.(values)
  }

  const handleInputChange = useCallback(
    (index: 0 | 1, newValue: number) => {
      setValue((prev) => {
        const next: [number, number] = [prev[0], prev[1]]
        next[index] = newValue
        onValueChange?.(next)
        return next
      })
    },
    [onValueChange]
  )

  const step = max > min ? (max - min) / 100 : 1

  return (
    <div className={cn(className, "space-y-4")}>
      <Slider
        onValueChange={handleSliderChange}
        value={value}
        step={step}
        min={min}
        max={max}
        aria-label="Price Range"
      />
      <div className="flex gap-4">
        <Input
          type="number"
          placeholder="min"
          value={value[0]}
          min={min}
          max={value[1]}
          onChange={(e) => handleInputChange(0, Number(e.target.value))}
        />
        <span className="mx-2 mt-2">-</span>
        <Input
          type="number"
          placeholder="max"
          max={max}
          min={value[0]}
          value={value[1]}
          onChange={(e) => handleInputChange(1, Number(e.target.value))}
        />
      </div>
    </div>
  )
}
