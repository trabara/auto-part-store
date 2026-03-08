"use client"

import { ProductOptionEntry } from "@/lib/util/product"
import { buildProductListUrl } from "@/lib/util/product-url"
import { SortOptions } from "@/lib/types"
import { ProductOptionValueFilter } from "@/lib/data/products"
import _ from "lodash"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useMemo, useRef } from "react"
import { useProductList } from "./use-product-list"

export const useProductFilters = () => {
  const router = useRouter()
  const pathname = usePathname()

  const {
    queryParams,
    activeOptions,
    currentPage,
    limit,
    sort,
    absolutePriceRange,
    availableOptions,
  } = useProductList((store) => ({
    queryParams: store.queryParams,
    activeOptions: store.activeOptions,
    currentPage: store.currentPage,
    limit: store.limit,
    sort: store.sort,
    absolutePriceRange: store.absolutePriceRange,
    availableOptions: store.availableOptions,
  }))

  // Derive current option_values array from store's activeOptions map
  const currentOptionValues: ProductOptionValueFilter[] = useMemo(() => {
    return Object.entries(activeOptions).flatMap(([option_id, values]) =>
      values.map((value) => ({ option_id, value }))
    )
  }, [activeOptions])

  // Price range comes from the server-provided absolute price range
  const priceRange = [absolutePriceRange.min, absolutePriceRange.max]

  // Build a new URL preserving all current filters except the changed one
  const buildUrl = useCallback(
    (
      overrides: Partial<{
        sort: SortOptions
        page: number
        min_price: number | undefined
        max_price: number | undefined
        status: ("in_stock" | "on_sale")[] | undefined
        option_values: ProductOptionValueFilter[]
        limit: number
      }>
    ) => {
      return buildProductListUrl(pathname, {
        sort: queryParams.sort,
        page: currentPage,
        min_price: queryParams.min_price,
        max_price: queryParams.max_price,
        status: queryParams.status,
        option_values: currentOptionValues,
        limit,
        ...overrides,
      })
    },
    [pathname, queryParams, currentPage, currentOptionValues, limit]
  )

  // Debounced price range navigation
  const debouncedPriceNav = useRef(
    _.debounce(
      (
        min: number | undefined,
        max: number | undefined,
        bUrl: typeof buildUrl
      ) => {
        router.push(bUrl({ min_price: min, max_price: max, page: 1 }), {
          scroll: false,
        })
      },
      600
    )
  ).current

  const handlePriceRangeChange = useCallback(
    (values: number[]) => {
      const min = values[0]
      const max = values[1]
      debouncedPriceNav(min, max, buildUrl)
    },
    [debouncedPriceNav, buildUrl]
  )

  const handleOptionChange = useCallback(
    (optionId: string, value: string) => (checked: boolean) => {
      const currentValues = activeOptions[optionId] ?? []
      const newValues = checked
        ? [...new Set([...currentValues, value])]
        : currentValues.filter((v) => v !== value)

      const newActiveOptions = { ...activeOptions }
      if (newValues.length === 0) {
        delete newActiveOptions[optionId]
      } else {
        newActiveOptions[optionId] = newValues
      }

      const newOptionValues: ProductOptionValueFilter[] = Object.entries(
        newActiveOptions
      ).flatMap(([oid, vals]) =>
        vals.map((v) => ({ option_id: oid, value: v }))
      )

      router.push(buildUrl({ option_values: newOptionValues, page: 1 }), {
        scroll: false,
      })
    },
    [activeOptions, buildUrl, router]
  )

  const removeOption = useCallback(
    (optionId: string, value: string) => {
      const newValues = (activeOptions[optionId] ?? []).filter(
        (v) => v !== value
      )
      const newActiveOptions = { ...activeOptions }
      if (newValues.length === 0) {
        delete newActiveOptions[optionId]
      } else {
        newActiveOptions[optionId] = newValues
      }

      const newOptionValues: ProductOptionValueFilter[] = Object.entries(
        newActiveOptions
      ).flatMap(([oid, vals]) =>
        vals.map((v) => ({ option_id: oid, value: v }))
      )

      router.push(buildUrl({ option_values: newOptionValues, page: 1 }), {
        scroll: false,
      })
    },
    [activeOptions, buildUrl, router]
  )

  const resetFilters = useCallback(() => {
    router.push(
      buildUrl({
        option_values: [],
        min_price: undefined,
        max_price: undefined,
        status: undefined,
        page: 1,
      }),
      { scroll: false }
    )
  }, [buildUrl, router])

  const handleStatusChange = useCallback(
    (value: "in_stock" | "on_sale", checked: boolean) => {
      const current = queryParams.status ?? []
      const next = checked
        ? [...new Set([...current, value])]
        : current.filter((s) => s !== value)
      router.push(
        buildUrl({ status: next.length > 0 ? next : undefined, page: 1 }),
        { scroll: false }
      )
    },
    [buildUrl, router, queryParams.status]
  )

  const setSort = useCallback(
    (newSort: SortOptions) => {
      router.push(buildUrl({ sort: newSort, page: 1 }), { scroll: false })
    },
    [buildUrl, router]
  )

  const setLimit = useCallback(
    (newLimit: number) => {
      router.push(buildUrl({ limit: newLimit, page: 1 }), { scroll: false })
    },
    [buildUrl, router]
  )

  const setPage = useCallback(
    (page: number) => {
      router.push(buildUrl({ page }), { scroll: false })
    },
    [buildUrl, router]
  )

  // Map server-provided availableOptions to the ProductOptionEntry shape
  const options: ProductOptionEntry[] = availableOptions.map((opt) => ({
    key: opt.option_id,
    title: opt.title,
    values: opt.values.map((value) => ({ optionId: opt.option_id, value })),
  }))

  const hasActiveFilters =
    currentOptionValues.length > 0 ||
    queryParams.min_price !== undefined ||
    queryParams.max_price !== undefined ||
    (queryParams.status !== undefined && queryParams.status.length > 0)

  return {
    options,
    priceRange,
    queryParams,
    activeOptions,
    currentOptionValues,
    hasActiveFilters,
    sort,
    isOptionActive: (optionId: string, value: string) =>
      (activeOptions[optionId] ?? []).includes(value),
    handlePriceRangeChange,
    handleOptionChange,
    handleStatusChange,
    removeOption,
    resetFilters,
    setSort,
    setLimit,
    setPage,
    getPriceRange: () => priceRange,
  }
}
