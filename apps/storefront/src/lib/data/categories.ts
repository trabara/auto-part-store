"use server"

import { sdk } from "@/lib/config"
import { HttpTypes } from "@medusajs/types"

export const listCategories = async (query?: { limit?: number }) => {
    const limit = query?.limit || 100

    const { product_categories } =
        await sdk.client.fetch<HttpTypes.StoreProductCategoryListResponse>(
            "/store/product-categories",
            {
                query: {
                    fields:
                        "*category_children, *parent_category, *parent_category.parent_category",
                    limit,
                    ...query,
                },
            }
        )

    return product_categories.filter((cat) => !cat.parent_category)
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
    const handle = categoryHandle.length > 1 ?
        categoryHandle[categoryHandle.length - 1] :
        categoryHandle[0]

    const { product_categories } =
        await sdk.client.fetch<HttpTypes.StoreProductCategoryListResponse>(
            `/store/product-categories`,
            {
                query: {
                    fields: `*category_children`,
                    handle,
                },
            }
        )
    return product_categories[0]
}

