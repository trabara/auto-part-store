import { AdminProduct, PaginatedResponse } from "@medusajs/framework/types";
import {
  Button,
  Container,
  DataTable,
  DataTableFilteringState,
  DataTablePaginationState,
  DataTableSortingState,
  Heading,
  toast,
  useDataTable,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sdk } from "~/lib/sdk";
import { Fitment } from "~/modules/fitment/schema";
import { createProductColumns } from "./columns";
import filters from "./filters";

type AdminProductListWithFitmentsResponse = PaginatedResponse<{
  /**
   * The list of products with their fitments.
   */
  products: (AdminProduct & { fitments: Fitment[] })[];
}>;

const ProductList = ({
  fitmentId,
}: {
  fitmentId?: string;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const limit = 15;
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  });
  const offset = useMemo(() => {
    return pagination.pageIndex * limit;
  }, [pagination]);

  const [search, setSearch] = useState<string>("");
  const [filtering, setFiltering] = useState<DataTableFilteringState>({});
  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);
  const [rowSelection, setRowSelection] = useState({});

  const filterValues = useMemo(() => {
    let result: Record<string, any> = {};
    Object.keys(filtering).forEach((key) => {
      const value = filtering[key];
      if (value) {
        _.set(result, key, value);
      }
    });
    return result;
  }, [filtering]);

  // Fetch all products or only linked products
  const { data, isLoading } = useQuery({
    queryFn: () => {
      return sdk.client.fetch<AdminProductListWithFitmentsResponse>(`/admin/products`, {
        query: {
          limit,
          offset,
          fields: "*variants.*,*collection.*,*fitments.*",
          order: sorting
            ? `${sorting.id}:${sorting.desc ? "desc" : "asc"}`
            : undefined,
          q: search || undefined,
        },
      });
    },
    queryKey: [
      [
        "products",
        limit,
        offset,
        search,
        filterValues,
        sorting?.id,
        sorting?.desc,
      ],
    ],
  });

  // Add isLinked flag to products when showing all
  const productsWithLinkStatus = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.products.map((product) => ({
      ...product,
      isLinked: product.fitments.some((fitment) => fitment.id === fitmentId),
    }));
  }, [data?.products, fitmentId]);

  // Link products mutation
  const linkMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      return sdk.client.fetch(`/admin/fitments/${fitmentId}/products`, {
        method: "POST",
        body: { product_ids: productIds },
      });
    },
    onSuccess: () => {
      toast.success("Products linked successfully");
      queryClient.invalidateQueries({ queryKey: [["products"]] });
      queryClient.invalidateQueries({ queryKey: [["fitment-products"]] });
      setRowSelection({});
    },
    onError: (error: any) => {
      toast.error("Failed to link products", {
        description: error.message || "An error occurred",
      });
    },
  });

  // Unlink products mutation
  const unlinkMutation = useMutation({
    mutationFn: async (productId: string) => {
      return sdk.client.fetch(
        `/admin/fitments/${fitmentId}/products/${productId}`,
        { method: "DELETE" },
      );
    },
    onSuccess: () => {
      toast.success("Product unlinked successfully");
      queryClient.invalidateQueries({ queryKey: [["products"]] });
      queryClient.invalidateQueries({ queryKey: [["fitment-products"]] });
      setRowSelection({});
    },
    onError: (error: any) => {
      toast.error("Failed to unlink product", {
        description: error.message || "An error occurred",
      });
    },
  });

  // Bulk unlink mutation
  const bulkUnlinkMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      return Promise.all(
        productIds.map((productId) =>
          sdk.client.fetch(
            `/admin/fitments/${fitmentId}/products/${productId}`,
            { method: "DELETE" },
          ),
        ),
      );
    },
    onSuccess: () => {
      toast.success("Products unlinked successfully");
      queryClient.invalidateQueries({ queryKey: [["products"]] });
      queryClient.invalidateQueries({ queryKey: [["fitment-products"]] });
      setRowSelection({});
    },
    onError: (error: any) => {
      toast.error("Failed to unlink products", {
        description: error.message || "An error occurred",
      });
    },
  });

  const handleLinkProduct = (productId: string) => {
    linkMutation.mutate([productId]);
  };

  const handleUnlinkProduct = (productId: string) => {
    unlinkMutation.mutate(productId);
  };

  const handleBulkLink = () => {
    const selectedIds = Object.keys(rowSelection);
    linkMutation.mutate(selectedIds);
  };

  const handleBulkUnlink = () => {
    const selectedIds = Object.keys(rowSelection);
    bulkUnlinkMutation.mutate(selectedIds);
  };

  // Get selected products with link status
  const selectedProducts = useMemo(() => {
    const selectedIds = Object.keys(rowSelection);
    return productsWithLinkStatus.filter((p) => selectedIds.includes(p.id));
  }, [rowSelection, productsWithLinkStatus]);

  const hasLinkedSelected = selectedProducts.some((p) => p.isLinked);
  const hasUnlinkedSelected = selectedProducts.some((p) => !p.isLinked);

  const tableColumns = useMemo(
    () =>
      createProductColumns({ onLinkProduct: handleLinkProduct, onUnlinkProduct: handleUnlinkProduct }),
    [],
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
                    isLoading={linkMutation.isPending}
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
                    isLoading={bulkUnlinkMutation.isPending}
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
