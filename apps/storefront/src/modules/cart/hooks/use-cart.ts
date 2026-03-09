"use client"

import { useCallback, useContext, useTransition } from "react"
import { useStoreWithEqualityFn } from "zustand/traditional"
import { shallow } from "zustand/vanilla/shallow"
import { addToCart } from "@/lib/data/cart"
import { CartStoreContext } from "../components/provider"
import { CartStore } from "../store"

export const useCartStore = <T>(selector: (store: CartStore) => T): T => {
  const store = useContext(CartStoreContext)
  if (!store) {
    throw new Error(
      "useCartStore must be used within CartProvider. Please wrap your component with CartProvider."
    )
  }
  return useStoreWithEqualityFn(store, selector, shallow)
}

export const useCart = () =>
  useCartStore((state) => ({
    cart: state.cart,
    isLoading: state.isLoading,
  }))

export const useCartItemCount = () =>
  useCartStore((state) => {
    const items = state.cart?.items ?? []
    return items.reduce((total, item) => total + (item.quantity ?? 0), 0)
  })

export const useAddToCart = () => {
  const store = useCartStore(store => ({
    setLoading: store.setLoading,
    updateCartFromServer: store.updateCartFromServer,
  }))
  const [isPending, startTransition] = useTransition()

  const add = useCallback(
    (variantId: string, quantity = 1) => {
      if (!store) return
      startTransition(async () => {
        store.setLoading(true)
        try {
          const updatedCart = await addToCart({ variantId, quantity })
          store.updateCartFromServer(updatedCart)
        } finally {
          store.setLoading(false)
        }
      })
    },
    [store]
  )

  return { add, isPending }
}
