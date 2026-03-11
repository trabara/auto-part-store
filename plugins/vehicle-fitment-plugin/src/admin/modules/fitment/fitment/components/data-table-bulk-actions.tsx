import { Trash } from "@medusajs/icons";
import {
  IconButton,
  toast,
  Tooltip,
  type UseDataTableReturn,
  usePrompt,
} from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { DataTableBulkActionsToolbar } from "../../../../components/bulk-actions-toolbar";
import { sdk } from "../../../../lib/sdk";
import { AdminFitmentWithProducts } from "../types";

type FitmentBulkActionsToolbarProps = {
  table: UseDataTableReturn<AdminFitmentWithProducts>;
};
export function FitmentBulkActionsToolbar({
  table,
}: FitmentBulkActionsToolbarProps) {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const queryClient = useQueryClient();

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = [];
      for (const id of ids) {
        const result = await sdk.client.fetch(`/admin/fitments/${id}`, {
          method: "DELETE",
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fitments"] });
      toast.success(t("fitment.toast.bulkDeleted"));
      // Clear row selection
      const selectedRows = table
        .getRowModel()
        .rows.filter((row) => row.getIsSelected());
      selectedRows.forEach((row) => row.toggleSelected(false));
    },
    onError: (error: any) => {
      toast.error(error?.message || t("fitment.toast.bulkDeleteError"));
    },
  });

  const handleBulkDelete = async () => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected());
    const selectedFitments = selectedRows.map((row) => row.original);
    const selectedIds = selectedFitments.map((f) => f.id);

    // Calculate total product links that will be removed
    const totalProductLinks = selectedFitments.reduce((sum, fitment) => {
      return sum + (fitment.products?.length || 0);
    }, 0);

    const confirmed = await prompt({
      title: t(
        selectedIds.length > 1
          ? "fitment.bulkDelete.title_plural"
          : "fitment.bulkDelete.title",
        { count: selectedIds.length },
      ),
      description:
        t(
          selectedIds.length > 1
            ? "fitment.bulkDelete.description_plural"
            : "fitment.bulkDelete.description",
          { count: selectedIds.length },
        ) +
        (totalProductLinks > 0
          ? t(
              totalProductLinks > 1
                ? "fitment.bulkDelete.withLinks_plural"
                : "fitment.bulkDelete.withLinks",
              { count: totalProductLinks },
            )
          : ""),
      confirmText: t("common.deleteAll"),
      cancelText: t("common.cancel"),
    });

    if (confirmed) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  return (
    <>
      <DataTableBulkActionsToolbar table={table} entityName="fitment">
        <Tooltip content={t("fitment.bulkDelete.tooltip")}>
          <IconButton
            className="rounded-none"
            size="large"
            variant="transparent"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
          >
            <Trash />
          </IconButton>
        </Tooltip>
      </DataTableBulkActionsToolbar>
    </>
  );
}
