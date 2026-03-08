"use server"

import { sdk } from "@/lib/config"
import { SortOptions } from "@/lib/types"
import { HttpTypes } from "@medusajs/types"
import { retreiveFitment } from "./fitments"
import { getRegion } from "./regions"

export type ProductOptionValueFilter = {
  option_id: string
  value: string
}

export type ProductPriceRange = {
  min: number
  max: number
}

export type ProductOptionMeta = {
  title: string
  option_id: string
  values: string[]
}

export type ProductListQueryParams = {
  category_id?: string
  limit?: number
  sort?: SortOptions
  min_price?: number
  max_price?: number
  option_values?: ProductOptionValueFilter[]
}

export type ProductListResponse = {
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
  priceRange: ProductPriceRange
  options: ProductOptionMeta[]
}

export type ProductListParams = {
  pageParam?: number
  queryParams?: ProductListQueryParams
}

export async function listProductOptions(): Promise<{
  options: HttpTypes.StoreProductOption[]
}> {
  return sdk.client.fetch(`/store/options`, {
    method: "GET",
    query: {
      fields: "*",
    },
  })
}

// Maps our SortOptions type to the Medusa `order` query param format.
// Medusa's get-query-config parses a plain string: prefix "-" means DESC,
// no prefix means ASC. e.g. "title" → ASC, "-title" → DESC.
// Price sorts are omitted here — calculated_price is not a DB column,
// so they are handled as a JS post-sort in the plugin controller.
function buildOrderParam(sort?: SortOptions): string | undefined {
  if (!sort) return undefined
  switch (sort) {
    case "name_asc":
      return "title"
    case "name_desc":
      return "-title"
    case "price_asc":
    case "price_desc":
      // Post-sorted server-side in the plugin controller
      return undefined
    case "created_at":
    default:
      return "-created_at"
  }
}

export async function listProducts({
  pageParam = 1,
  queryParams,
}: ProductListParams): Promise<ProductListResponse> {
  const {
    limit = 12,
    sort,
    min_price,
    max_price,
    option_values,
    ...restQueryParams
  } = queryParams || {}

  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  const region = await getRegion("tn")
  if (!region) {
    throw new Error("Region not found")
  }

  const fitment = await retreiveFitment()

  const order = buildOrderParam(sort)

  const query: Record<string, any> = {
    limit,
    offset,
    fitment_id: fitment?.id,
    region_id: region.id,
    currency_code: region.currency_code,
    fields:
      "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags",
    ...(order && { order }),
    // Pass sort so the controller can apply price post-sort
    ...(sort && { sort }),
    ...(min_price !== undefined && { min_price }),
    ...(max_price !== undefined && { max_price }),
    ...restQueryParams,
  }

  // Encode option_values as repeated indexed params so Medusa's Zod parser
  // picks them up as an array of objects:
  // option_values[0][option_id]=x&option_values[0][value]=y
  if (option_values && option_values.length > 0) {
    option_values.forEach((ov, i) => {
      query[`option_values[${i}][option_id]`] = ov.option_id
      query[`option_values[${i}][value]`] = ov.value
    })
  }

  const { products, metadata, price_range, options } = await sdk.client.fetch<
    HttpTypes.StoreProductListResponse & {
      metadata?: { count?: number }
      price_range?: ProductPriceRange
      options?: ProductOptionMeta[]
    }
  >(`/store/products/v2`, {
    method: "GET",
    query,
  })

  const totalCount = (metadata as any)?.count ?? products?.length ?? 0
  const hasNextPage = totalCount > offset + limit

  return {
    nextPage: hasNextPage ? pageParam + 1 : null,
    queryParams,
    priceRange: price_range ?? { min: 0, max: 0 },
    options: options ?? [],
    response: {
      products: products || [],
      count: totalCount,
    },
  }
}

// Kept for backward compatibility — thin wrapper around listProducts
export type ProductListWithSortParams = ProductListParams & {
  sortBy?: SortOptions
}

export async function listProductsWithSort({
  pageParam = 1,
  queryParams,
  sortBy,
}: ProductListWithSortParams): Promise<ProductListResponse> {
  return listProducts({
    pageParam,
    queryParams: {
      ...queryParams,
      ...(sortBy && { sort: sortBy }),
    },
  })
}

export const getProductTypes = async () => {
  const { product_types } =
    await sdk.client.fetch<HttpTypes.StoreProductTypeListResponse>(
      "/store/product-types",
      {
        query: {
          limit: 100,
        },
      }
    )

  return product_types
}

export const getProductTags = async () => {
  const { product_tags } =
    await sdk.client.fetch<HttpTypes.StoreProductTagListResponse>(
      "/store/product-tags",
      {
        query: {
          limit: 100,
        },
      }
    )

  return product_tags
}
