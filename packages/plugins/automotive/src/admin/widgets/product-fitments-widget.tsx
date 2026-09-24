import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { PageQueryParams } from "@repo/medusa-ui";
import { useDeleteMutation } from "@repo/medusa-ui/hooks/use-delete-mutation";
import { usePageQuery } from "@repo/medusa-ui/hooks/use-page-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Vehicle } from "../../modules/fitment/schemas/vehicle";
import { createFitmentColumns } from "../components/data-table-columns";
import { sdk } from "../lib/sdk";

const listProductFitments =
  (productId: string) => (signal: AbortSignal, params: PageQueryParams) =>
    sdk.client.fetch<any>(`/admin/products/${productId}/fitments`, {
      signal,
      query: {
        ...params,
      },
    });

const ProductFitmentsWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: productId } = useParams();

  const [queryConfig] = usePageQuery({
    queryKey: "fitments",
    selectFn: (data) => ({
      data: data?.data,
      rowCount: data?.metadata?.count ?? 0,
    }),
    queryFn: listProductFitments(productId!),
  });

  // Mutation to unlink a fitment
  const unlinkMutation = useDeleteMutation({
    invalidateKeys: ["fitments"],
    successMessage: t("fitment.toast.unlinked"),
    errorMessage: t("fitment.toast.unlinkError"),
    deleteFn: (fitmentId) =>
      sdk.client.fetch(`/admin/products/${productId}/fitments/${fitmentId}`, {
        method: "DELETE",
      }),
  });

  const handleEdit = (f: Vehicle) => navigate(`/vehicles/${f.id}/edit`);

  const handleUnlink = (f: Vehicle) => unlinkMutation.mutateAsync(f.id);

  const columns = useMemo(
    () =>
      createFitmentColumns(t, { onEdit: handleEdit, onUnlink: handleUnlink }),
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
          <Heading level="h2">{t("fitment.widget.title")}</Heading>
          <div>
            <Button
              size="small"
              variant="secondary"
              onClick={() => navigate(`/products/${productId}/fitments`)}
            >
              {t("fitment.widget.link")}
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
