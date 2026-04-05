import { Container, DataTable, Heading, useDataTable } from "@medusajs/ui";
import { useDeleteMutation } from "@repo/admin/hooks/use-delete-mutation";
import { usePageQuery } from "@repo/admin/hooks/use-page-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { deleteFitment, listFitments } from "../data";
import { AdminFitmentWithProducts } from "../types";
import { createFitmentColumns } from "./data-table-columns";

const FitmentDataTable = ({ productId }: { productId?: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [queryConfig] = usePageQuery({
    queryKey: "fitments",
    selectFn: (data: any) => ({
      data: data?.data,
      rowCount: data?.metadata?.count ?? 0,
    }),
    queryFn: listFitments,
  });

  const deleteMutation = useDeleteMutation({
    invalidateKeys: ["fitments"],
    successMessage: t("fitment.toast.deleted"),
    errorMessage: t("fitment.toast.deleteError"),
    deleteFn: deleteFitment,
  });

  const columns = useMemo(
    () =>
      createFitmentColumns(t, {
        productId,
        onLink: () =>
          productId ? navigate(`/products/${productId}`) : undefined,
        onUnlink: () =>
          productId ? navigate(`/products/${productId}`) : undefined,
        onDelete: (fitment: AdminFitmentWithProducts) =>
          deleteMutation.mutateAsync(fitment.id),
      }),
    [productId, navigate, deleteMutation, t],
  );

  const table = useDataTable({
    ...queryConfig,
    columns,
    onRowClick: (_, row) => navigate(`/fitments/${row.id}/products`),
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">{t("fitment.page.title")}</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              {t("fitment.page.subtitle")}
            </p>
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export default FitmentDataTable;
