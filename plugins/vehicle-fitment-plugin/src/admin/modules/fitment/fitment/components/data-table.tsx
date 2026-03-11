import {
  Button,
  Container,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCrudContext } from "../../../../context/crud-context";
import { useDeleteMutation, usePaginatedQuery } from "../../../../hooks";
import { deleteFitment, listFitments } from "../data";
import { AdminFitmentWithProducts } from "../types";
import { FitmentBulkActionsToolbar } from "./data-table-bulk-actions";
import { createFitmentColumns } from "./data-table-columns";
import { createFitmentFilters } from "./data-table-filters";

const FitmentDataTable = ({ productId }: { productId?: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { edit, setIsCreate } = useCrudContext<AdminFitmentWithProducts>();

  // Use paginated query hook
  const queryConfig = usePaginatedQuery({
    queryKey: "fitments",
    selectFn: (data) => ({
      data: data?.fitments,
      rowCount: data?.metadata.count,
    }),
    queryFn: listFitments,
  });

  // Use delete mutation hook
  const deleteMutation = useDeleteMutation({
    invalidateKeys: ["fitments"],
    successMessage: t("fitment.toast.deleted"),
    errorMessage: t("fitment.toast.deleteError"),
    deleteFn: deleteFitment,
  });

  // Create columns with handlers
  const columns = useMemo(
    () =>
      createFitmentColumns(t, {
        productId,
        onLink: () =>
          productId ? navigate(`/products/${productId}`) : undefined,
        onUnlink: () =>
          productId ? navigate(`/products/${productId}`) : undefined,
        onEdit: (fitment) => edit(fitment),
        onDelete: (fitment) => deleteMutation.mutate(fitment.id),
      }),
    [productId, navigate, deleteMutation, edit, t],
  );

  const filters = useMemo(() => createFitmentFilters(t), [t]);

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
          <div>
            <Heading level="h1">{t("fitment.page.title")}</Heading>
            <p className="text-ui-fg-subtle text-sm mt-1">
              {t("fitment.page.subtitle")}
            </p>
          </div>

          <Button variant="secondary" size="small" onClick={() => setIsCreate(true)}>
            {t("common.create")}
          </Button>
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
      <FitmentBulkActionsToolbar table={table} />
    </Container>
  );
};

export default FitmentDataTable;
