"use client"

import PriceSlider from "@/modules/products/components/price-slider"
import { cn } from "@/lib/utils"

import { useProductFilters } from "@/modules/products/hooks/use-product-filters"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { HTMLAttributes } from "react"
import { useTranslations } from "next-intl"

type CategoryFiltersProps = HTMLAttributes<HTMLDivElement> & {}

export default function CategoryFilters({
  className,
  ...props
}: CategoryFiltersProps) {
  const t = useTranslations("filters")
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
      <Accordion type="multiple" defaultValue={["0"]}>
        {options.map((option) => (
          <AccordionItem key={option.key} value={option.key}>
            <AccordionTrigger className="font-semibold">
              {option.title}
            </AccordionTrigger>
            <AccordionContent className="max-h-64 overflow-y-auto">
              <div className="mt-4 flex flex-col gap-3">
                {option.values.map(({ optionId, value }, index) => (
                  <div
                    key={`${optionId}-${value}`}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`${option.key}-${index}`}
                      checked={isOptionActive(optionId, value)}
                      onCheckedChange={handleOptionChange(optionId, value)}
                    />
                    <Label
                      htmlFor={`${option.key}-${index}`}
                      className="text-sm"
                    >
                      {value}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
        <AccordionItem value="price">
          <AccordionTrigger className="font-semibold">
            {t("price")}
          </AccordionTrigger>
          <AccordionContent className="p-4">
            <PriceSlider
              min={absMin}
              max={absMax}
              initialMin={queryParams.min_price}
              initialMax={queryParams.max_price}
              onValueChange={handlePriceRangeChange}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="status">
          <AccordionTrigger className="font-semibold">
            {t("status")}
          </AccordionTrigger>
          <AccordionContent className="max-h-64 overflow-y-auto">
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="status-in-stock"
                  checked={(queryParams.status ?? []).includes("in_stock")}
                  onCheckedChange={(checked) =>
                    handleStatusChange("in_stock", !!checked)
                  }
                />
                <Label
                  htmlFor="status-in-stock"
                  className="text-sm cursor-pointer"
                >
                  {t("inStock")}
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
                <Label
                  htmlFor="status-on-sale"
                  className="text-sm cursor-pointer"
                >
                  {t("onSale")}
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
