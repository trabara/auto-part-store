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
      sdk.client.fetch(
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
    fitmentId: fitmentId || "",
  });

  const {
    rowSelection,
    setRowSelection,
    handleLinkProduct,
    handleUnlinkProduct,
  } = productLinking;

  // Create table columns
  const tableColumns = useMemo(
    () =>
      createProductColumns({
        onLinkProduct: handleLinkProduct,
        onUnlinkProduct: handleUnlinkProduct,
      }),
    [handleLinkProduct, handleUnlinkProduct],
  );

  const table = useDataTable<AdminProductWithFitments>({
    columns: tableColumns,
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
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <ProductLinkageBulkActionsToolbar table={table} fitmentId={fitmentId}/>
    </Container>
  );
};

export default ProductList;
