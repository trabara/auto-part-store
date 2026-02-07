"use client"

import { type ReactNode, createContext, useContext } from "react"
import { shallow } from "zustand/shallow"
import { useStoreWithEqualityFn } from "zustand/traditional"
import { CategoryState, CategoryStore, createCategoryStore } from "../store"

export type CategoryStoreApi = ReturnType<typeof createCategoryStore>

export const CategoryStoreContext = createContext<CategoryStoreApi | undefined>(
  undefined
)

export interface CategoryStoreProviderProps {
  children: ReactNode
  initialState?: CategoryState
}

export const CategoryStoreProvider = ({
  children,
  initialState,
}: CategoryStoreProviderProps) => {
  const store = createCategoryStore(initialState)
  return (
    <CategoryStoreContext.Provider value={store}>
      {children}
    </CategoryStoreContext.Provider>
  )
}

export const useCategoryStore = <T,>(
  selector: (store: CategoryStore) => T
): T => {
  const categoryStoreContext = useContext(CategoryStoreContext)
  if (!categoryStoreContext) {
    throw new Error(
      `useCategoryStore must be used within CategoryStoreProvider`
    )
  }

  return useStoreWithEqualityFn(categoryStoreContext, selector, shallow)
}
