import {
  ProductList,
  ProductListContent,
  ProductListHeader,
} from "@/modules/products/components/product-list"
import { ProductListProvider } from "@/modules/products/components/provider"
import { StoreProduct } from "@medusajs/types"
import CategoryFilters from "../components/category-filters"

export type ProductListTemplateProps = {
  products: StoreProduct[]
}

export default async function ProductListTemplate({
  products,
}: ProductListTemplateProps) {


  return (
    <ProductListProvider
      initialState={{
        queryParams: {},
        products,
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
    </ProductListProvider>
  )
}
