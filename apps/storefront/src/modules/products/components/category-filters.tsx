"use client"

import { cn } from "@repo/ui/lib/utils"
import PriceSlider from "@/modules/products/components/price-slider"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion"
import { Checkbox } from "@repo/ui/components/checkbox"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/field"
import { useProductFilters } from "@/modules/products/hooks/use-product-filters"
import { HTMLAttributes } from "react"

type CategoryFiltersProps = HTMLAttributes<HTMLDivElement> & {}

export default function CategoryFilters({
  className,
  ...props
}: CategoryFiltersProps) {
  const {
    options,
    isOptionActive,
    getPriceRange,
    handlePriceRangeChange,
    handleOptionChange,
  } = useProductFilters()

  return (
    <div className={cn("flex flex-col space-y-8", className)} {...props}>
      <div>
        <h5 className="uppercase">Price</h5>
        <div className="mt-4 flex flex-col space-y-2">
          <PriceSlider
            defaultValue={getPriceRange()}
            onValueChange={handlePriceRangeChange}
          />
        </div>
      </div>
      <Accordion type="multiple" defaultValue={["0"]}>
        {options.map((option) => (
          <AccordionItem key={option.key} value={option.key}>
            <AccordionTrigger className="px-0">
              <h5 className="uppercase">{option.key}</h5>
            </AccordionTrigger>
            <AccordionContent>
              <Field>
                <FieldGroup className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {option.values.map((value, index) => (
                    <FieldContent key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${option.key}-${index}`}
                        checked={isOptionActive(option.key, value)}
                        onCheckedChange={handleOptionChange(option.key, value)}
                      />
                      <FieldLabel htmlFor={`${option.key}-${index}`} className="text-sm">
                        {value[0]?.value}
                      </FieldLabel>
                    </FieldContent>
                  ))}
                </FieldGroup>
              </Field>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
