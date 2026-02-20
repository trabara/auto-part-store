import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useParams } from "react-router-dom";
import ProductList from "~/admin/modules/fitment/product";
const ProductListPage = () => {
  const { id } = useParams();

  return <ProductList fitmentId={id} />;
};

export const config = defineRouteConfig({
  label: "Fitment Products",
});

export default ProductListPage;
