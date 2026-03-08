import {
  ProductList,
  ProductListContent,
  ProductListFilterTags,
  ProductListHeader,
  ProductListPagination,
} from "@/modules/products/components/product-list"
import { ProductListProvider } from "@/modules/products/components/provider"
import { SortOptions } from "@/lib/types"
import {
  ProductOptionMeta,
  ProductOptionValueFilter,
  ProductPriceRange,
} from "@/lib/data/products"
import { StoreProduct } from "@medusajs/types"
import CategoryFilters from "../components/category-filters"

export type ProductListTemplateProps = {
  products: StoreProduct[]
  totalCount: number
  currentPage: number
  limit: number
  sort: SortOptions
  minPrice?: number
  maxPrice?: number
  optionValues: ProductOptionValueFilter[]
  priceRange: ProductPriceRange
  availableOptions: ProductOptionMeta[]
}

export default async function ProductListTemplate({
  products,
  totalCount,
  currentPage,
  limit,
  sort,
  minPrice,
  maxPrice,
  optionValues,
  priceRange,
  availableOptions,
}: ProductListTemplateProps) {
  // Build activeOptions map from optionValues for fast UI lookups
  const activeOptions: Record<string, string[]> = {}
  for (const { option_id, value } of optionValues) {
    if (!activeOptions[option_id]) activeOptions[option_id] = []
    activeOptions[option_id].push(value)
  }

  return (
    <ProductListProvider
      initialState={{
        queryParams: {
          limit,
          sort,
          ...(minPrice !== undefined && { min_price: minPrice }),
          ...(maxPrice !== undefined && { max_price: maxPrice }),
          ...(optionValues.length > 0 && { option_values: optionValues }),
        },
        activeOptions,
        products,
        display: "grid",
        isLoading: false,
        totalCount,
        currentPage,
        limit,
        sort,
        priceRange: null,
        absolutePriceRange: priceRange,
        availableOptions,
      }}
    >
      <div className="pt-4 flex">
        <div className="min-w-75 hidden xl:block mr-8 relative">
          <CategoryFilters className="static" />
        </div>

        <ProductList className="mb-8 flex-auto min-w-0">
          <ProductListHeader />
          <ProductListFilterTags className="flex flex-wrap mb-4" />
          <ProductListContent />
          <ProductListPagination className="mt-8" />
        </ProductList>
      </div>
    </ProductListProvider>
  )
}
