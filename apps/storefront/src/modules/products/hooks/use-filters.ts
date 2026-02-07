import _ from "lodash"
import { useRef } from "react"
import { useCategoryStore } from "../components/provider"
import { getPriceRange, getProductOptions } from "../utils"

export const useFilters = () => {
  const priceRef = useRef(
    useCategoryStore((store) => ({
      range: getPriceRange(store.products),
      handleChange: _.debounce(store.handlePriceFilterChange, 500),
    }))
  )

  const filterSelector = useCategoryStore((store) => ({
    options: getProductOptions(store.products),
    isOptionActive: store.isOptionActive,
    handleOptionsChange: store.handleOptionsChange,
  }))

  return {
    ...filterSelector,
    getPriceRange: () => priceRef.current?.range || [0, 0],
    handlePriceRangeChange: (values: number[]) => {
      priceRef.current.handleChange(values)
    },
  }
}
