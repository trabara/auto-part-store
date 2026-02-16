import { AdminProduct, PaginatedResponse } from "@medusajs/framework/types";
import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { sdk } from "~/lib/sdk";
import {
  usePaginatedQuery,
  useProductLinking,
  getSelectedProducts,
} from "~/hooks";
import { Fitment } from "~/modules/fitment/schema";
import { createProductColumns } from "./columns";
import filters from "./filters";

type AdminProductListWithFitmentsResponse = PaginatedResponse<{
  /**
   * The list of products with their fitments.
   */
  products: (AdminProduct & { fitments: Fitment[] })[];
}>;

const ProductList = ({ fitmentId }: { fitmentId?: string }) => {
  const navigate = useNavigate();

  // Use paginated query hook
  const {
    data,
    isLoading,
    pagination,
    setPagination,
    search,
    setSearch,
    filtering,
    setFiltering,
    sorting,
    setSorting,
  } = usePaginatedQuery<AdminProductListWithFitmentsResponse>({
    queryKey: "products",
    fields: "*variants.*,*collection.*,*fitments.*",
    queryFn: (params) =>
      sdk.client.fetch<AdminProductListWithFitmentsResponse>(
        `/admin/products`,
        {
          query: params,
        },
      ),
  });

  // Add isLinked flag to products
  const productsWithLinkStatus = useMemo(() => {
    if (!data) return [];
    return data.products.map((product) => ({
      ...product,
      isLinked: product.fitments.some((fitment) => fitment.id === fitmentId),
    }));
  }, [data?.products, fitmentId]);

  // Use product linking hook (only when fitmentId is provided)
  const productLinking = useProductLinking({
    linkFn: (productIds: string[]) =>
      sdk.client.fetch(`/admin/fitments/${fitmentId}/products`, {
        method: "POST",
        body: { product_ids: productIds },
      }),
    unlinkFn: (productId: string) =>
      sdk.client.fetch(`/admin/fitments/${fitmentId}/products/${productId}`, {
        method: "DELETE",
      }),
  });

  const {
    rowSelection,
    setRowSelection,
    handleLinkProduct,
    handleUnlinkProduct,
    handleBulkLink,
    handleBulkUnlink,
    isLinking,
    isBulkUnlinking,
  } = productLinking;

  // Get selected products with link status
  const selectedProducts = useMemo(
    () => getSelectedProducts(productsWithLinkStatus, rowSelection),
    [rowSelection, productsWithLinkStatus],
  );

  const hasLinkedSelected = selectedProducts.some((p) => p.isLinked);
  const hasUnlinkedSelected = selectedProducts.some((p) => !p.isLinked);

  // Create table columns
  const tableColumns = useMemo(
    () =>
      createProductColumns({
        onLinkProduct: handleLinkProduct,
        onUnlinkProduct: handleUnlinkProduct,
      }),
    [handleLinkProduct, handleUnlinkProduct],
  );

  const table = useDataTable({
    columns: tableColumns as any,
    filters,
    data: productsWithLinkStatus || [],
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: setRowSelection,
    },
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    search: {
      state: search,
      onSearchChange: setSearch,
      debounce: 2000,
    },
    filtering: {
      state: filtering,
      onFilteringChange: setFiltering,
    },
    sorting: {
      state: sorting,
      onSortingChange: setSorting,
    },
    onRowClick: (_event, row) => navigate(`/products/${row.id}`),
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading>Products</Heading>
          <div className="flex items-center justify-center gap-x-2">
            {Object.keys(rowSelection).length > 0 && (
              <>
                {hasUnlinkedSelected && (
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleBulkLink}
                    isLoading={isLinking}
                  >
                    Attach Selected (
                    {selectedProducts.filter((p) => !p.isLinked).length})
                  </Button>
                )}
                {hasLinkedSelected && (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleBulkUnlink}
                    isLoading={isBulkUnlinking}
                  >
                    Detach Selected (
                    {selectedProducts.filter((p) => p.isLinked).length})
                  </Button>
                )}
              </>
            )}
          </div>
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export default ProductList;
