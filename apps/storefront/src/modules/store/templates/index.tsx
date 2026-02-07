import { listProducts } from "@/modules/products/data"
import {
  ProductList,
  ProductListContent,
  ProductListHeader,
} from "@/modules/products/components/product-list"
import { CategoryStoreProvider } from "@/modules/products/components/provider"
import CategoryFilters from "../components/category-filters"

export type StoreTemplateProps = {
  queryParams?: { category: string }
}

export default async function StoreTemplate({
  queryParams,
}: StoreTemplateProps) {
  const { response } = await listProducts({
    queryParams: {},
  })

  return (
    <CategoryStoreProvider
      initialState={{
        queryParams: {},
        products: response.products,
        display: "grid",
        options: {},
        isLoading: false,
      }}
    >
      <div className="pt-4 flex">
        <div className="min-w-75 hidden xl:block mr-8 relative">
          <CategoryFilters className="static" />
        </div>

        <ProductList className="mb-8 flex-auto">
          <ProductListHeader />
          <ProductListContent />
        </ProductList>
      </div>
    </CategoryStoreProvider>
  )
}
