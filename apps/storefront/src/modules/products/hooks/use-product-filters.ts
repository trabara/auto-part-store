import { getPriceRange, getProductOptions } from "@/lib/util/product"
import _ from "lodash"
import { useRef } from "react"
import { useProductList } from "./use-product-list"

export const useProductFilters = () => {
  const priceRef = useRef(
    useProductList((store) => ({
      range: getPriceRange(store.products),
      handleChange: _.debounce(store.handlePriceFilterChange, 500),
    }))
  )

  const filterSelector = useProductList((store) => ({
    options: getProductOptions(store.products),
    isOptionActive: store.isOptionActive,
    handleOptionChange: store.handleOptionChange,
  }))

  return {
    ...filterSelector,
    getPriceRange: () => priceRef.current?.range || [0, 0],
    handlePriceRangeChange: (values: number[]) => {
      priceRef.current.handleChange(values)
    },
  }
}
