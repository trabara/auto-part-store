import { create } from "zustand"
import type { WishlistItem } from "@/lib/data/wishlist"

type WishlistStore = {
  items: WishlistItem[]
  initialized: boolean
  setItems: (items: WishlistItem[]) => void
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  getItemByProductId: (productId: string) => WishlistItem | undefined
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  initialized: false,
  setItems: (items) => set({ items, initialized: true }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product_id !== productId),
    })),
  isWishlisted: (productId) =>
    get().items.some((i) => i.product_id === productId),
  getItemByProductId: (productId) =>
    get().items.find((i) => i.product_id === productId),
}))
