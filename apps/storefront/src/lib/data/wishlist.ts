"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"

export type WishlistItem = {
  id: string
  product_id: string
  product_variant_id: string
  quantity: number
}

export type Wishlist = {
  id: string
  items: WishlistItem[]
}

export async function getWishlist(): Promise<Wishlist | null> {
  const headers = await getAuthHeaders()
  const authHeaders = headers as Record<string, string>
  if (!authHeaders.authorization) return null

  try {
    const result = await sdk.client.fetch<{ wishlist: Wishlist }>(
      "/store/customers/me/wishlist",
      { method: "GET", headers }
    )
    return result.wishlist ?? null
  } catch {
    return null
  }
}

export async function addToWishlist(
  productId: string,
  productVariantId: string,
  quantity = 1
): Promise<void> {
  const headers = await getAuthHeaders()
  await sdk.client.fetch("/store/customers/me/wishlist/items", {
    method: "POST",
    headers,
    body: { productId, productVariantId, quantity },
  })
}

export async function removeFromWishlist(
  productId: string,
  productVariantId: string
): Promise<void> {
  const headers = await getAuthHeaders()
  await sdk.client.fetch(
    `/store/customers/me/wishlist/items?productId=${productId}&productVariantId=${productVariantId}`,
    { method: "DELETE", headers }
  )
}
