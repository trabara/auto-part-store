"use server"

import { sdk } from "@/lib/config"
import { ClientHeaders } from "@medusajs/js-sdk"
import { HttpTypes, PaginatedResponse } from "@medusajs/types"
import { getLocaleHeader } from "./cookies"

type ProductCategoryImage = {
  id: string
  url: string
}

export type StoreProductCategory = Omit<
  HttpTypes.StoreProductCategory,
  "parent_category"
> & {
  product_category_image: ProductCategoryImage[]
  parent_category?: StoreProductCategory
  category_children?: StoreProductCategory[]
}

type StorProductCategoryListResponse = PaginatedResponse<{
  /**
   * The paginated list of categories.
   */
  product_categories: StoreProductCategory[]
}>

export const listCategories = async (query?: { limit?: number }) => {
  const limit = query?.limit || 100
  const headers = {
    ...(await getLocaleHeader()),
  } as ClientHeaders

  return sdk.client.fetch<StorProductCategoryListResponse>(
    "/store/product-categories",
    {
      headers,
      query: {
        fields:
          "*category_children, *category_children.product_category_image, *parent_category, *parent_category.parent_category, *product_category_image",
        limit,
        ...query,
      },

    },
  ).then(({ product_categories }) => {
    console.log("Fetched categories: ", product_categories)
    return product_categories.filter((cat) => !cat.parent_category)
  })

}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle =
    categoryHandle.length > 1
      ? categoryHandle[categoryHandle.length - 1]
      : categoryHandle[0]

  const headers = {
    ...(await getLocaleHeader()),
  } as ClientHeaders

  const { product_categories } =
    await sdk.client.fetch<StorProductCategoryListResponse>(
      `/store/product-categories`,
      {
        headers,
        query: {
          fields:
            "*category_children, *category_children.product_category_image, *parent_category, *parent_category.parent_category, *product_category_image",
          handle,
        }
      }
    )
  return product_categories[0]
}
