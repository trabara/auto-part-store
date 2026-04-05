import { Container, DataTable, Heading, useDataTable } from "@medusajs/ui";
import { usePageQuery } from "@repo/admin/hooks/use-page-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { createProductColumns } from "./components/columns";
import { ProductLinkageBulkActionsToolbar } from "./components/data-table-bulk-actions";
import filters from "./components/filters";
import { listProductsWithFitments } from "./data";
import { useProductLinkage } from "./hooks/use-product-linkage";

type ProductListProps = {
  fitmentId?: string;
};
const ProductList = ({ fitmentId }: ProductListProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Use paginated query hook
  const [queryConfig] = usePageQuery({
    queryKey: "products",
    queryFn: listProductsWithFitments,
    selectFn: (data) => ({
      data: data?.data,
      rowCount: data?.metadata?.count ?? 0,
    }),
  });

  // Use product linkage hook (only when fitmentId is provided)
  const productLinkage = useProductLinkage({
    fitmentId: fitmentId || "",
    selectedProducts: [],
  });

  // Create table columns
  const columns = useMemo(
    () =>
      createProductColumns({
        onLinkProduct: productLinkage.handleLinkProduct,
        onUnlinkProduct: productLinkage.handleUnlinkProduct,
        t,
      }),
    [productLinkage, t],
  );

  const table = useDataTable({
    ...queryConfig,
    columns,
    filters,
    onRowClick: (_, row) => navigate(`/products/${row.id}`),
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading>{t("product.page.title")}</Heading>
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <ProductLinkageBulkActionsToolbar table={table} fitmentId={fitmentId} />
    </Container>
  );
};

export default ProductList;
