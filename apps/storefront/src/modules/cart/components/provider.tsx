"use client"

import { StoreCart } from "@medusajs/types"
import { type ReactNode, createContext, useState } from "react"
import { StoreApi } from "zustand/vanilla"
import { CartState, CartStore, createCartStore } from "../store"

export const CartStoreContext = createContext<StoreApi<CartStore> | undefined>(
  undefined
)

export interface CartProviderProps {
  children: ReactNode
  initialCart?: StoreCart | null
}

export function CartProvider({ children, initialCart }: CartProviderProps) {
  const initState: Partial<CartState> = {
    cart: initialCart ?? null,
  }

  // useState with lazy initializer keeps the store instance stable across renders
  const [store] = useState(() => createCartStore(initState))

  return (
    <CartStoreContext.Provider value={store}>
      {children}
    </CartStoreContext.Provider>
  )
}
