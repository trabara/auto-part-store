import { StoreProduct } from "@medusajs/types"
import { createStore } from "zustand/vanilla"
import { SortOptions } from "@/lib/types"
import {
  ProductOptionMeta,
  ProductOptionValueFilter,
  ProductListQueryParams,
  ProductPriceRange,
} from "@/lib/data/products"
import { Display } from "./types"

export type ProductListState = {
  queryParams: ProductListQueryParams
  // Active option filters: Record<optionId, selectedValues[]>
  activeOptions: Record<string, string[]>
  products: StoreProduct[]
  display: Display
  isLoading: boolean
  totalCount: number
  currentPage: number
  limit: number
  sort: SortOptions
  priceRange: [number, number] | null
  /** Absolute price range across the full unfiltered catalog for this category */
  absolutePriceRange: ProductPriceRange
  /** All available options from the full unfiltered catalog */
  availableOptions: ProductOptionMeta[]
  error?: string
}

export type ProductListActions = {
  setDisplay: (display: Display) => void
  isOptionActive: (optionId: string, value: string) => boolean
}

export type ProductListStore = ProductListState & ProductListActions

export const INITIAL_PRODUCT_LIST_STATE: ProductListState = {
  queryParams: {},
  activeOptions: {},
  products: [],
  display: "grid",
  isLoading: false,
  totalCount: 0,
  currentPage: 1,
  limit: 12,
  sort: "created_at",
  priceRange: null,
  absolutePriceRange: { min: 0, max: 0 },
  availableOptions: [],
}

export const createProductListStore = (
  initState: Partial<ProductListState> = {}
) => {
  const state: ProductListState = {
    ...INITIAL_PRODUCT_LIST_STATE,
    ...initState,
  }

  return createStore<ProductListStore>()((set, get) => ({
    ...state,
    setDisplay: (display) => set({ display }),
    isOptionActive: (optionId: string, value: string) => {
      const { activeOptions } = get()
      return (activeOptions[optionId] ?? []).includes(value)
    },
  }))
}
