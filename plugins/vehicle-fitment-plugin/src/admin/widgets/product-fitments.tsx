import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Fitment } from "../../modules/fitment/schema";
import { useDeleteMutation, usePaginatedQuery } from "../hooks";
import { sdk } from "../lib/sdk";
import { createFitmentColumns } from "../modules/fitment/fitment/components/data-table-columns";

type ProductFitmentsResponse = {
  fitments: Fitment[];
  metadata: {
    count: number;
  };
};

const ProductFitmentsWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const productId = params.id;

  const queryConfig = usePaginatedQuery<ProductFitmentsResponse, Fitment>({
    queryKey: "fitments",
    queryFn: (params) =>
      sdk.client.fetch(`/admin/products/${productId}/fitments`, {
        query: params,
      }),
    selectFn: (data) => ({
      data: data?.fitments,
      rowCount: data?.metadata?.count || 0,
    }),
  });

  // Mutation to unlink a fitment
  const unlinkMutation = useDeleteMutation({
    invalidateKeys: ["fitments", productId!],
    successMessage: t("fitment.toast.unlinked"),
    errorMessage: t("fitment.toast.unlinkError"),
    deleteFn: (fitmentId) =>
      sdk.client.fetch(`/admin/products/${productId}/fitments/${fitmentId}`, {
        method: "DELETE",
      }),
  });

  const handleEdit = (fitment: Fitment) =>
    navigate(`/fitments/${fitment.id}/edit`);

  const handleUnlink = (fitment: Fitment) => unlinkMutation.mutate(fitment.id);

  const columns = useMemo(
    () =>
      createFitmentColumns(t, { onEdit: handleEdit, onUnlink: handleUnlink, }),
    [handleEdit, handleUnlink, t],
  );

  const table = useDataTable({
    ...queryConfig,
    columns,
  });

  return (
    <Container className="p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex justify-between items-center">
          <Heading level="h2">{t("widget.fitments.title")}</Heading>
          <div>
            <Button
              size="small"
              variant="secondary"
              onClick={() => navigate(`/products/${productId}/fitments`)}
            >
              {t("widget.fitments.link")}
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
