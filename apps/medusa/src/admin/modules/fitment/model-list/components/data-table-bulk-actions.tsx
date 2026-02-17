import {
  IconButton,
  Tooltip,
  type UseDataTableReturn,
  usePrompt,
  toast,
} from "@medusajs/ui";
import { Trash } from "@medusajs/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "~/lib/sdk";
import { DataTableBulkActionsToolbar } from "~/components/bulk-actions-toolbar";
import { ModelWithFitments } from "..";

type ModelBulkActionsToolbarProps = {
  table: UseDataTableReturn<ModelWithFitments>;
};

export function ModelBulkActionsToolbar({
  table,
}: ModelBulkActionsToolbarProps) {
  const prompt = usePrompt();
  const queryClient = useQueryClient();

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = [];
      for (const id of ids) {
        const result = await sdk.client.fetch(`/admin/models/${id}`, {
          method: "DELETE",
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Models deleted successfully");
      // Clear row selection
      const selectedRows = table
        .getRowModel()
        .rows.filter((row) => row.getIsSelected());
      selectedRows.forEach((row) => row.toggleSelected(false));
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete models");
    },
  });

  const handleBulkDelete = async () => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected());
    const selectedModels = selectedRows.map((row) => row.original);
    const selectedIds = selectedModels.map((m) => m.id);

    // Calculate total fitments that will be deleted
    const totalFitments = selectedModels.reduce((sum, model) => {
      return sum + (model.fitments?.length || 0);
    }, 0);

    const confirmed = await prompt({
      title: `Delete ${selectedIds.length} Model${selectedIds.length > 1 ? "s" : ""}`,
      description: `Are you sure you want to delete ${selectedIds.length} model${selectedIds.length > 1 ? "s" : ""}?${totalFitments > 0 ? ` This will also delete ~${totalFitments} fitment${totalFitments > 1 ? "s" : ""}.` : ""}`,
      confirmText: "Delete All",
      cancelText: "Cancel",
    });

    if (confirmed) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  return (
    <DataTableBulkActionsToolbar table={table} entityName="model">
      <Tooltip content="Delete selected models">
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
  );
}
