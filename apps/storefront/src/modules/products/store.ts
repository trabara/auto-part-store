import { StoreProduct, StoreProductOptionValue } from "@medusajs/types"
import { createStore } from "zustand/vanilla"
import { listProductsWithSort, ProductListQueryParams } from "./data"
import { Display } from "./types"

export type CategoryState = {
  queryParams: ProductListQueryParams
  options: Record<string, StoreProductOptionValue[]>
  products: StoreProduct[]
  display: Display
  isLoading: boolean
  error?: string
}

export type CategoryActions = {
  resetOptions: () => void
  removeOptions: (key: string, values: StoreProductOptionValue[]) => void
  setDisplay: (display: Display) => void
  handlePriceFilterChange: (values: number[]) => void
  handleOptionsChange: (
    key: string,
    values: StoreProductOptionValue[]
  ) => (checked: boolean) => void
  isOptionActive: (key: string, values: StoreProductOptionValue[]) => boolean
}

export type CategoryStore = CategoryState & CategoryActions

export const INITIAL_CATEGORY_STATE: CategoryState = {
  queryParams: {},
  options: {},
  products: [],
  display: "grid",
  isLoading: false,
}

export const createCategoryStore = (
  initState: CategoryState = INITIAL_CATEGORY_STATE
) => {
  return createStore<CategoryStore>()((set, get) => ({
    ...initState,
    setDisplay: (display) => set({ display }),
    resetOptions: () => {
      set({ options: {} })
    },
    handleOptionsChange: (key, values) => async (checked: boolean) => {
      const { queryParams } = get()
      const currentValues = queryParams.options?.values || []
      const newValues = checked
        ? [...currentValues, ...values]
        : currentValues.filter(
            (v) => !values.some((value) => value.id === v.id)
          )

      const newQueryParams = {
        ...queryParams,
        options: {
          values: newValues,
        },
      }

      try {
        const { response } = await listProductsWithSort({
          queryParams: newQueryParams,
        })
        

        // set({
        //   products: response.products,
        //   queryParams: newQueryParams,
        // })
      } catch (error) {
        console.log(error)
      }
    },
    removeOptions: (key, values) => {},
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
