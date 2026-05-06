"use client"

import { useWishlistInit } from "@/modules/wishlist/hooks/use-wishlist"

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  useWishlistInit()
  return <>{children}</>
}
