import { useContext } from "react"
import { useStoreWithEqualityFn } from "zustand/traditional"
import { shallow } from "zustand/vanilla/shallow"
import { ProductListProviderContext } from "../components/provider"
import { ProductListStore } from "../store"

export const useProductList = <T,>(
    selector: (store: ProductListStore) => T
): T => {
    const store = useContext(ProductListProviderContext)
    if (!store) {
        throw new Error(
            `useProductList must be used within ProductListProvider. Please wrap your component with ProductListProvider.`
        )
    }

    return useStoreWithEqualityFn(store, selector, shallow)
}
