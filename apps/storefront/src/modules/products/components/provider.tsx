"use client"

import { type ReactNode, createContext } from "react"
import { StoreApi } from "zustand/vanilla"
import { createProductListStore, ProductListState, ProductListStore } from "../store"


export const ProductListProviderContext = createContext<StoreApi<ProductListStore> | undefined>(
  undefined
)

export interface ProductListProviderProviderProps {
  children: ReactNode
  initialState?: ProductListState
}

export const ProductListProvider = ({
  children,
  initialState,
}: ProductListProviderProviderProps) => {
  const store = createProductListStore(initialState)
  return (
    <ProductListProviderContext.Provider value={store}>
      {children}
    </ProductListProviderContext.Provider>
  )
}

