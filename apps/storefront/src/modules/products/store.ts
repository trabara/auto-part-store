import { StoreProduct, StoreProductOptionValue } from "@medusajs/types"
import { createStore } from "zustand/vanilla"
import { Display } from "./types"
import { listProductsWithSort, ProductListQueryParams } from "@/lib/data/products"

export type ProductListState = {
  queryParams: ProductListQueryParams
  options: Record<string, StoreProductOptionValue[]>
  products: StoreProduct[]
  display: Display
  isLoading: boolean
  error?: string
}

export type ProductListActions = {
  resetOptions: () => void
  removeOptions: (key: string, values: StoreProductOptionValue[]) => void
  setDisplay: (display: Display) => void
  handlePriceFilterChange: (values: number[]) => void
  handleOptionChange: (
    key: string,
    values: StoreProductOptionValue[]
  ) => (checked: boolean) => void
  isOptionActive: (key: string, values: StoreProductOptionValue[]) => boolean
}

export type ProductListStore = ProductListState & ProductListActions

export const INITIAL_PRODUCT_LIST_STATE: ProductListState = {
  queryParams: {},
  options: {},
  products: [],
  display: "grid",
  isLoading: false,
}

export const createProductListStore = (
  initState: ProductListState = INITIAL_PRODUCT_LIST_STATE
) => {
  return createStore<ProductListStore>()((set, get) => ({
    ...initState,
    setDisplay: (display) => set({ display }),
    resetOptions: () => {
      set({ options: {} })
    },
    handleOptionChange: (key, values) => async (checked: boolean) => {

    },
    removeOptions: (key, values) => { },
    isOptionActive: (key, values) => {
      const { options } = get()
      const activeValues = options[key] || []
      return values.every((value) => activeValues.some((v) => v.id === value.id))
    },
    handlePriceFilterChange: async (values) => {
      const { queryParams } = get()
      const minPrice = values[0] ?? 0
      const maxPrice = values[1] ?? Infinity

      const newQueryParams = {
        ...queryParams,
        min_price: minPrice,
        max_price: maxPrice === Infinity ? undefined : maxPrice,
      }
      try {
        const { response } = await listProductsWithSort({
          queryParams: newQueryParams,
        })

        set({
          products: response.products,
          queryParams: newQueryParams,
        })
      } catch (error) {
        console.log(error)
      }
    },
  }))
}
