import { Container, DataTable, Heading, useDataTable } from "@medusajs/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usePaginatedQuery } from "../../../hooks";
import { createProductColumns } from "./components/columns";
import { ProductLinkageBulkActionsToolbar } from "./components/data-table-bulk-actions";
import filters from "./components/filters";
import { listProductsWithFitments } from "./data";
import { useProductLinking } from "./hooks/use-product-linking";

const ProductList = ({ fitmentId }: { fitmentId?: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Use paginated query hook
  const queryConfig = usePaginatedQuery({
    queryKey: "products",
    queryFn: listProductsWithFitments,
    selectFn: (data) => {
      const products = data?.products?.map((product) => ({
        ...product,
        isLinked: product.fitments.some((fitment) => fitment.id === fitmentId),
      }));
      return { data: products, rowCount: data?.metadata.count };
    },
  });

  // Use product linking hook (only when fitmentId is provided)
  const productLinking = useProductLinking({
    fitmentId: fitmentId || "",
    selectedProducts: [],
  });

  // Create table columns
  const tableColumns = useMemo(
    () =>
      createProductColumns({
        onLinkProduct: productLinking.handleLinkProduct,
        onUnlinkProduct: productLinking.handleUnlinkProduct,
        t,
      }),
    [productLinking, t],
  );

  const table = useDataTable({
    ...queryConfig,
    columns: tableColumns,
    filters,
    onRowClick: (_event, row) => navigate(`/products/${row.id}`),
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
