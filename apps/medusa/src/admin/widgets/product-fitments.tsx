import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable
} from "@medusajs/ui";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeleteMutation, usePaginatedQuery } from "~/admin/hooks";
import { sdk } from "~/admin/lib/sdk";
import { createFitmentColumns } from "~/admin/modules/fitment/fitment/components/data-table-columns";
import { Fitment } from "~/modules/fitment/schema";

type ProductFitmentsResponse = {
  fitments: Fitment[],
  metadata: {
    count: number
  }
}

const ProductFitmentsWidget = () => {
  const navigate = useNavigate();
  const params = useParams();
  const productId = params.id;

  const queryConfig = usePaginatedQuery<ProductFitmentsResponse, Fitment>({
    queryKey: "fitments",
    queryFn: (params) =>
      sdk.client.fetch(`/admin/products/${productId}/fitments`, {
        query: params,
      }),
    selectFn: (data) => ({ data: data?.fitments, rowCount: data?.metadata?.count || 0 }),
  })

  // Mutation to unlink a fitment
  const unlinkMutation = useDeleteMutation({
    invalidateKeys: ["fitments", productId!],
    successMessage: "Fitment unlinked successfully",
    errorMessage: "Failed to unlink fitment",
    deleteFn: (fitmentId) =>
      sdk.client.fetch(`/admin/products/${productId}/fitments/${fitmentId}`, {
        method: "DELETE",
      }),
  });

  const handleEdit = (fitment: Fitment) =>
    navigate(`/fitments/${fitment.id}/edit`);


  const handleUnlink = (fitment: Fitment) =>
    unlinkMutation.mutate(fitment.id);


  const columns = useMemo(() => createFitmentColumns({ onEdit: handleEdit, onUnlink: handleUnlink }), [])


  const table = useDataTable({
    ...queryConfig,
    columns,
  });

  return (
    <Container className="p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex justify-between items-center" >
          <Heading level="h2">Fitments</Heading>
          <div>
            <Button
              size="small"
              variant="secondary"
              onClick={() => navigate(`/products/${productId}/fitments`)}
            >
              Link
            </Button>
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductFitmentsWidget;
