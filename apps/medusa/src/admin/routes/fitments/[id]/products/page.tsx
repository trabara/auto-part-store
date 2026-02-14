import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useParams } from "react-router-dom"
import ProductList from "~/features/product-list"
const ProductListPage = () => {
    const { id } = useParams()
    
    return (
        <ProductList fitmentId={id} />
    )
}

export const config = defineRouteConfig({})

export default ProductListPage