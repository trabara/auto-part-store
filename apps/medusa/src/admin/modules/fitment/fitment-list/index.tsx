import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteMutation, usePaginatedQuery } from "~/hooks";
import { sdk } from "~/lib/sdk";
import { Fitment } from "~/modules/fitment/schema";
import { createFitmentColumns } from "./components/columns";
import { FitmentBulkActionsToolbar } from "./components/data-table-bulk-actions";
import filters from "./components/filters";
import { AdminFitmentResponse, AdminFitmentWithProducts } from "./types";


const FitmentList = ({ productId }: { productId?: string }) => {
  const navigate = useNavigate();

  // Use paginated query hook
  const queryConfig = usePaginatedQuery<AdminFitmentResponse, AdminFitmentWithProducts>({
    queryKey: "fitments",
    fields: "*engine,*model,*model.make,*products.*",
    selectFn: (data) => data?.fitments,
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
    ...queryConfig,
    columns,
    filters,
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
