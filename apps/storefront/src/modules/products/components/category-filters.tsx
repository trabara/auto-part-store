"use client"

import { cn } from "@repo/ui/lib/utils"
import PriceSlider from "@/modules/products/components/price-slider"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/field"
import { Checkbox } from "@repo/ui/components/checkbox"
import { useProductFilters } from "@/modules/products/hooks/use-product-filters"
import { HTMLAttributes } from "react"
import { Label } from "@repo/ui/components/label"

type CategoryFiltersProps = HTMLAttributes<HTMLDivElement> & {}

export default function CategoryFilters({
  className,
  ...props
}: CategoryFiltersProps) {
  const {
    options,
    priceRange,
    queryParams,
    isOptionActive,
    handlePriceRangeChange,
    handleOptionChange,
    handleStatusChange,
  } = useProductFilters()

  const absMin = (priceRange ?? [0, 0])[0] ?? 0
  const absMax = (priceRange ?? [0, 0])[1] ?? 0

  return (
    <div className={cn("flex flex-col space-y-8", className)} {...props}>


      {/* Price range */}
      <div>
        <h5 className="uppercase">Price</h5>
        <div className="mt-4 flex flex-col space-y-2">
          <PriceSlider
            min={absMin}
            max={absMax}
            initialMin={queryParams.min_price}
            initialMax={queryParams.max_price}
            onValueChange={handlePriceRangeChange}
          />
        </div>
      </div>

      {/* Option filters */}
      <Accordion type="multiple" defaultValue={["0"]}>
        {options.map((option) => (
          <AccordionItem key={option.key} value={option.key}>
            <AccordionTrigger className="px-0">
              <h5 className="uppercase">{option.title}</h5>
            </AccordionTrigger>
            <AccordionContent>
              <Field>
                <FieldGroup className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {option.values.map(({ optionId, value }, index) => (
                    <FieldContent
                      key={index}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`${option.key}-${index}`}
                        checked={isOptionActive(optionId, value)}
                        onCheckedChange={handleOptionChange(optionId, value)}
                      />
                      <FieldLabel
                        htmlFor={`${option.key}-${index}`}
                        className="text-sm"
                      >
                        {value}
                      </FieldLabel>
                    </FieldContent>
                  ))}
                </FieldGroup>
              </Field>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Status filter */}
      <div>
        <h5 className="uppercase">Status</h5>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="status-in-stock"
              checked={(queryParams.status ?? []).includes("in_stock")}
              onCheckedChange={(checked) =>
                handleStatusChange("in_stock", !!checked)
              }
            />
            <Label htmlFor="status-in-stock" className="text-sm cursor-pointer">
              In stock
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="status-on-sale"
              checked={(queryParams.status ?? []).includes("on_sale")}
              onCheckedChange={(checked) =>
                handleStatusChange("on_sale", !!checked)
              }
            />
            <Label htmlFor="status-on-sale" className="text-sm cursor-pointer">
              On sale
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}
