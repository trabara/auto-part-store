"use server"

import { HttpTypes, StoreProductOptionValue } from "@medusajs/types"
// import { getAuthHeaders, getCacheOptions } from "./cookies"
// import { getRegion, retrieveRegion } from "./regions"
import { sdk } from "@/lib/config"

import { SortOptions } from "./types"
import { sortProducts } from "./utils"
import { getDefaultRegion } from "../regions/data"

export type ProductListQueryParams = HttpTypes.FindParams &
  HttpTypes.StoreProductListParams & {
    min_price?: number
    max_price?: number
    options?: {
      values: StoreProductOptionValue[]
    }
  }

export type ProductListResponse = {
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}

export type ProductListParams = {
  pageParam?: number
  queryParams?: ProductListQueryParams
  // countryCode?: string
  // regionId?: string
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  // countryCode,
  // regionId,
}: ProductListParams): Promise<ProductListResponse> => {
  // if (!countryCode && !regionId) {
  //   throw new Error("Country code or region ID is required")
  // }
  const {
    limit = 12,
    options,
    min_price,
    max_price,
    ...restQueryParams
  } = queryParams || {}

  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  // let region: HttpTypes.StoreRegion | undefined | null

  //   if (countryCode) {
  //     region = await getRegion(countryCode)
  //   } else {
  //     region = await retrieveRegion(regionId!)
  //   }

  //   if (!region) {
  //     return {
  //       response: { products: [], count: 0 },
  //       nextPage: null,
  //     }
  //   }

  //   const headers = {
  //     ...(await getAuthHeaders()),
  //   }

  //   const next = {
  //     ...(await getCacheOptions("products")),
  //   }
  const defaultRegion = await getDefaultRegion()

  let { products, count } =
    await sdk.client.fetch<HttpTypes.StoreProductListResponse>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: defaultRegion?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
          ...restQueryParams,
        },
        // headers,
        // next,
        // cache: "force-cache",
      }
    )

  if (min_price) {
    products = products.filter(({ variants }) =>
      variants?.some(
        ({ calculated_price }) =>
          calculated_price?.calculated_amount &&
          calculated_price?.calculated_amount >= min_price!
      )
    )
  }

  if (max_price) {
    products = products.filter(({ variants }) =>
      variants?.some(
        ({ calculated_price }) =>
          calculated_price?.calculated_amount &&
          calculated_price?.calculated_amount <= max_price!
      )
    )
  }

  if (options?.values && options.values.length > 0) {
    products = products.filter(({ options: productOptions }) =>
      options.values.every((filterValue) =>
        productOptions?.some(
          (productOption) =>
            productOption.values?.some(
              (value) => value.id === filterValue.id
            ) && productOption.id === filterValue.option_id
        )
      )
    )
  }

  return {
    nextPage: products.length > offset + limit ? pageParam + 1 : null,
    queryParams,
    response: {
      products,
      count: products.length,
    },
  }
}

export type ProductListWithSortParams = ProductListParams & {
  sortBy?: SortOptions
  // countryCode: string
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  pageParam = 1,
  queryParams,
  sortBy = "created_at",
  // countryCode,
}: ProductListWithSortParams): Promise<ProductListResponse> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    // countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const page = (pageParam - 1) * limit

  const nextPage = count > page + limit ? page + limit : null

  const paginatedProducts = sortedProducts.slice(page, page + limit)

  console.log(products)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}
