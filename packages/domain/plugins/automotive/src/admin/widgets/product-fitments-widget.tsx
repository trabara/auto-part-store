import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { useDeleteMutation } from "@repo/admin/hooks/use-delete-mutation";
import { usePageQuery } from "@repo/admin/hooks/use-page-query";
import { PageQueryParams, PageResponse } from "@repo/admin/types/query";
import { Fitment } from "@trabara/core/dtos";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { sdk } from "../lib/sdk";
import { createFitmentColumns } from "../components/data-table-columns";

const listProductFitments = (productId: string) => (signal: AbortSignal, params: PageQueryParams) =>
  sdk.client.fetch<PageResponse<Fitment>>(`/admin/products/${productId}/fitments`, {
    signal,
    query: {
      ...params,
    },
  });


const ProductFitmentsWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: productId } = useParams();

  const [queryConfig] = usePageQuery<Fitment>({
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

  const handleEdit = (f: Fitment) =>
    navigate(`/fitments/${f.id}/edit`);

  const handleUnlink = (f: Fitment) => unlinkMutation.mutateAsync(f.id);

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
