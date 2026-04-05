import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useParams } from "react-router-dom";
import ProductList from "../../../products";

const ProductListPage = () => {
  const { id } = useParams();

  return <ProductList fitmentId={id} />;
};

export const config = defineRouteConfig({
  label: "fitment.products.page.label",
  translationNs: "translation",
});

export default ProductListPage;
