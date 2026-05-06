"use client"

import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "@/lib/data/wishlist"
import { useWishlistStore } from "../store/use-wishlist-store"
import { useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"

/**
 * Initializes the wishlist from the server and exposes toggle logic.
 * Call once near the top of the component tree (e.g. in a layout or provider).
 */
export function useWishlistInit() {
  const { setItems, initialized } = useWishlistStore()

  useEffect(() => {
    if (initialized) return
    getWishlist().then((wishlist) => {
      setItems(wishlist?.items ?? [])
    })
  }, [initialized, setItems])
}

/**
 * Per-product wishlist hook. Use in product cards / product pages.
 */
export function useWishlist(productId: string, variantId: string) {
  const router = useRouter()
  const { isWishlisted, addItem, removeItem, getItemByProductId } =
    useWishlistStore()
  const [isPending, startTransition] = useTransition()

  const wishlisted = isWishlisted(productId)

  function toggle() {
    startTransition(async () => {
      if (wishlisted) {
        const item = getItemByProductId(productId)
        if (!item) return
        // Optimistic remove
        removeItem(productId)
        try {
          await removeFromWishlist(productId, item.product_variant_id)
        } catch {
          // Rollback
          addItem(item)
        }
      } else {
        // Optimistic add
        const optimisticItem = {
          id: `optimistic-${productId}`,
          product_id: productId,
          product_variant_id: variantId,
          quantity: 1,
        }
        addItem(optimisticItem)
        try {
          await addToWishlist(productId, variantId)
          // Refresh to get the real item ID from server
          const wishlist = await getWishlist()
          if (wishlist) {
            useWishlistStore.getState().setItems(wishlist.items)
          }
        } catch (err: any) {
          // Rollback
          removeItem(productId)
          if (err?.status === 401 || err?.status === 403) {
            router.push("/auth/login")
          }
        }
      }
    })
  }

  return { wishlisted, toggle, isPending }
}
