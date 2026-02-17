import {
  Container,
  DataTable,
  Heading,
  useDataTable
} from "@medusajs/ui";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  usePaginatedQuery,
} from "~/hooks";
import { sdk } from "~/lib/sdk";
import { createProductColumns } from "./components/columns";
import { ProductLinkageBulkActionsToolbar } from "./components/data-table-bulk-actions";
import filters from "./components/filters";
import { useProductLinking } from "./hooks/use-product-linking";
import { AdminProductListWithFitmentsResponse, AdminProductWithFitments } from "./types";

const ProductList = ({ fitmentId }: { fitmentId?: string }) => {
  const navigate = useNavigate();

  // Use paginated query hook
  const queryConfig = usePaginatedQuery<AdminProductListWithFitmentsResponse, AdminProductWithFitments>({
    queryKey: "products",
    fields: "*variants.*,*collection.*,*fitments.*",
    selectFn: (data) => {
      const products = data?.products?.map((product) => ({
        ...product,
        isLinked: product.fitments.some((fitment) => fitment.id === fitmentId),
      }));
      return { data: products, rowCount: data?.metadata.count };
    },
    queryFn: (params) =>
      sdk.client.fetch(
        `/admin/products`,
        {
          query: params,
        },
      ).then((res: any) => {
        return {
          products: res.products,
          metadata: {
            count: res.count,
            offset: res.offset,
            limit: res.limit,
          }
        }
      }),
  });

  // Use product linking hook (only when fitmentId is provided)
  const productLinking = useProductLinking({
    fitmentId: fitmentId || "",
    selectedProducts: []
  });

  // Create table columns
  const tableColumns = useMemo(
    () =>
      createProductColumns({
        onLinkProduct: productLinking.handleLinkProduct,
        onUnlinkProduct: productLinking.handleUnlinkProduct,
      }),
    [productLinking],
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
          <Heading>Products</Heading>
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <ProductLinkageBulkActionsToolbar table={table} fitmentId={fitmentId} />
    </Container>
  );
};

export default ProductList;
