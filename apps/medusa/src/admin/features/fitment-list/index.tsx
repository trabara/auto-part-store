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
import { usePaginatedQuery, useDeleteMutation } from "~/hooks";
import { Fitment } from "~/modules/fitment/schema";
import { createFitmentColumns } from "./components/columns";
import filters from "./components/filters";
import { AdminProduct } from "@medusajs/framework/types";
import { FitmentBulkActionsToolbar } from "./components/data-table-bulk-actions";

export type AdminFitmentWithProducts = Fitment & {
  products: AdminProduct[];
};

type AdminFitmentResponse = {
  fitments: AdminFitmentWithProducts[];
  metadata: {
    count: number;
    offset: number;
    limit: number;
  };
};

const FitmentList = ({ productId }: { productId?: string }) => {
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
  } = usePaginatedQuery<AdminFitmentResponse>({
    queryKey: "fitments",
    fields: "*engine,*model,*model.make,*products.*",
    queryFn: (params) =>
      sdk.client.fetch<AdminFitmentResponse>(`/admin/fitments`, {
        query: params,
      }),
  });

  // Use delete mutation hook
  const deleteMutation = useDeleteMutation({
    invalidateKeys: ["fitments"],
    successMessage: "Fitment deleted successfully",
    errorMessage: "Failed to delete fitment",
    deleteFn: (id) =>
      sdk.client.fetch(`/admin/fitments/${id}`, { method: "DELETE" }),
  });

  // Create columns with handlers
  const columns = useMemo(
    () =>
      createFitmentColumns({
        productId,
        onLink: () =>
          productId ? navigate(`/products/${productId}`) : undefined,
        onUnlink: () =>
          productId ? navigate(`/products/${productId}`) : undefined,
        onEdit: (fitment: Fitment) => navigate(`/fitments/${fitment.id}/edit`),
        onDelete: (fitment: Fitment) => deleteMutation.mutate(fitment.id),
      }),
    [productId, navigate, deleteMutation],
  );

  const table = useDataTable({
    columns,
    filters,
    data: data?.fitments || [],
    getRowId: (row) => row.id,
    rowCount: data?.metadata.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    search: {
      state: search,
      onSearchChange: setSearch,
    },
    filtering: {
      state: filtering,
      onFilteringChange: setFiltering,
    },
    sorting: {
      // Pass the pagination state and updater to the table instance
      state: sorting,
      onSortingChange: setSorting,
    },
    onRowClick: (_event, row) => navigate(`/fitments/${row.id}/products`),
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading>Fitments</Heading>
          <div className="flex items-center justify-center gap-x-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => navigate("/fitments/create")}
            >
              Create
            </Button>
          </div>
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <FitmentBulkActionsToolbar table={table} />
    </Container>
  );
};

export default FitmentList;
