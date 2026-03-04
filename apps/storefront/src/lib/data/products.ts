"use server"

import { sdk } from "@/lib/config"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "../types"
import { sortProducts } from "../util/product"
import { retreiveFitment } from "./fitments"
import { getRegion } from "./regions"

export type ProductListQueryParams = HttpTypes.FindParams & {
    category_id?: string
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

export async function listProducts({
    pageParam = 1,
    queryParams,
    // countryCode,
    // regionId,
}: ProductListParams): Promise<ProductListResponse> {
    // if (!countryCode && !regionId) {
    //   throw new Error("Country code or region ID is required")
    // }
    const {
        limit = 12,
        ...resetQueryParams
    } = queryParams || {}

    const _pageParam = Math.max(pageParam, 1)
    const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

    //   let region: HttpTypes.StoreRegion | undefined | null

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

    // const headers = {
    //     ...(await getAuthHeaders()),
    // }

    //   const next = {
    //     ...(await getCacheOptions("products")),
    //   }

    const region = await getRegion('tn')
    if (!region) {
        throw new Error("Region not found")
    }

    const fitment = await retreiveFitment()
    
    const { products } = await sdk.client.fetch<HttpTypes.StoreProductListResponse>(
        `/store/get-products`,
        {
            method: "GET",
            query: {
                limit,
                offset,
                fitment_id: fitment?.id,
                region_id: region.id,
                currency_code: region.currency_code,
                fields:
                    "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags",
                ...resetQueryParams,
            },
            // headers,
            // next,
            // cache: "force-cache",
        }
    )
    console.log('products', products)
    // if (min_price) {
    //     products = products.filter(({ variants }) =>
    //         variants?.some(
    //             ({ calculated_price }) =>
    //                 calculated_price?.calculated_amount &&
    //                 calculated_price?.calculated_amount >= min_price!
    //         )
    //     )
    // }

    // if (max_price) {
    //     products = products.filter(({ variants }) =>
    //         variants?.some(
    //             ({ calculated_price }) =>
    //                 calculated_price?.calculated_amount &&
    //                 calculated_price?.calculated_amount <= max_price!
    //         )
    //     )
    // }

    // if (options?.values && options.values.length > 0) {
    //     products = products.filter(({ options: productOptions }) =>
    //         options.values.every((filterValue) =>
    //             productOptions?.some(
    //                 (productOption) =>
    //                     productOption.values?.some(
    //                         (value) => value.id === filterValue.id
    //                     ) && productOption.id === filterValue.option_id
    //             )
    //         )
    //     )
    // }

    return {
        nextPage: products?.length > offset + limit ? pageParam + 1 : null,
        queryParams,
        response: {
            products: products || [],
            count: products?.length || 0,
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
export async function listProductsWithSort({
    pageParam = 1,
    queryParams,
    sortBy = "created_at",
    // countryCode,
}: ProductListWithSortParams): Promise<ProductListResponse> {
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

    return {
        nextPage,
        queryParams,
        response: {
            products: paginatedProducts,
            count,
        },
    }
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
