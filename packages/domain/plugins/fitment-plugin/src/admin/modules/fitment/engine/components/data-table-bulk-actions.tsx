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
import { Engine } from "@trabara/core/dtos";

type EngineBulkActionsToolbarProps = {
  table: UseDataTableReturn<Engine>;
};

export function EngineBulkActionsToolbar({
  table,
}: EngineBulkActionsToolbarProps) {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const queryClient = useQueryClient();

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = [];
      for (const id of ids) {
        const result = await sdk.client.fetch(`/admin/engines/${id}`, {
          method: "DELETE",
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engines"] });
      toast.success(t("engine.toast.bulkDeleted"));
      // Clear row selection
      const selectedRows = table
        .getRowModel()
        .rows.filter((row) => row.getIsSelected());
      selectedRows.forEach((row) => row.toggleSelected(false));
    },
    onError: (error: any) => {
      toast.error(error?.message || t("engine.toast.bulkDeleteError"));
    },
  });

  const handleBulkDelete = async () => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected());
    const selectedEngines = selectedRows.map((row) => row.original);
    const selectedIds = selectedEngines.map((e) => e.id);

    const confirmed = await prompt({
      title: t("engine.bulkDelete.title", { count: selectedIds.length }),
      description: t("engine.bulkDelete.description", {
        count: selectedIds.length,
      }),
      confirmText: t("common.deleteAll"),
      cancelText: t("common.cancel"),
    });

    if (confirmed) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  return (
    <DataTableBulkActionsToolbar table={table} entityName="engine">
      <Tooltip content={t("engine.bulkDelete.tooltip")}>
        <IconButton
          size="large"
          className="rounded-none text-ui-fg-error hover:bg-ui-error/10 data-[state=active]:bg-ui-error/20"
          variant="transparent"
          onClick={handleBulkDelete}
          disabled={bulkDeleteMutation.isPending}
        >
          <Trash />
        </IconButton>
      </Tooltip>
    </DataTableBulkActionsToolbar>
  );
}
