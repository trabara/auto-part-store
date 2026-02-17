import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  DataTable,
  DataTablePaginationState,
  Heading,
  toast,
  useDataTable
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createFitmentColumns } from "~/modules/fitment/fitment-list/components/columns";
import { sdk } from "~/lib/sdk";
import { Fitment } from "~/modules/fitment/schema";


const ProductFitmentsWidget = () => {
  const navigate = useNavigate();
  const params = useParams();
  const productId = params.id;
  const queryClient = useQueryClient();

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Fetch fitments for this product
  const { data, } = useQuery<{ fitments: Fitment[] }>({
    queryKey: ["fitments", productId],
    queryFn: () => sdk.client.fetch(
      `/admin/products/${productId}/fitments`,
    )
  });

  // Mutation to unlink a fitment
  const unlinkMutation = useMutation({
    mutationFn: async (fitmentId: string) => {
      return sdk.client.fetch(
        `/admin/products/${productId}/fitments/${fitmentId}`,
        {
          method: "DELETE",
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fitments", productId],
      });
      toast.success("Fitment unlinked successfully");
    },
    onError: () => {
      toast.error("Failed to unlink fitment");
    },
  });

  const handleEdit = (fitment: Fitment) =>
    navigate(`/fitments/${fitment.id}/edit`);


  const handleUnlink = (fitment: Fitment) =>
    unlinkMutation.mutate(fitment.id);


  const columns = useMemo(() => createFitmentColumns({ onEdit: handleEdit, onUnlink: handleUnlink }), [])
  const fitments = data?.fitments || [];
  
  const table = useDataTable({
    data: fitments,
    columns,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
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
