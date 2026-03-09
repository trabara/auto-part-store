import { StoreCart } from "@medusajs/types"
import { createStore } from "zustand/vanilla"

export type CartState = {
  cart: StoreCart | null
  isSideSheetOpen: boolean
  isLoading: boolean
}

export type CartActions = {
  setCart: (cart: StoreCart | null) => void
  setLoading: (isLoading: boolean) => void
  setSideSheetOpen: (isOpen: boolean) => void
  updateCartFromServer: (cart: StoreCart) => void
}

export type CartStore = CartState & CartActions

export const INITIAL_CART_STATE: CartState = {
  cart: null,
  isLoading: false,
  isSideSheetOpen: false,
}

export const createCartStore = (initState: Partial<CartState> = {}) => {
  const state: CartState = {
    ...INITIAL_CART_STATE,
    ...initState,
  }

  return createStore<CartStore>()((set) => ({
    ...state,
    setCart: (cart) => set({ cart }),
    setSideSheetOpen: (isOpen) => set({ isSideSheetOpen: isOpen }),
    setLoading: (isLoading) => set({ isLoading }),
    updateCartFromServer: (cart) => set({ cart }),
  }))
}
