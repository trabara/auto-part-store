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
        cache: "force-cache",
      }
    )

  return product_categories
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  const { product_categories } =
    await sdk.client.fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields: `*category_children, *products`,
          handle,
        },
        cache: "force-cache",
      }
    )
  return product_categories[0]
}

export const getProductTypes = async () => {
  const { product_types } =
    await sdk.client.fetch<HttpTypes.StoreProductTypeListResponse>(
      "/store/product-types",
      {
        query: {
          limit: 100,
        },
        cache: "force-cache",
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
        cache: "force-cache",
      }
    )

  return product_tags
}
