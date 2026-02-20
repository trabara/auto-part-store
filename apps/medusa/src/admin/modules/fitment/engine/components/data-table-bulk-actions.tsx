import { Trash } from "@medusajs/icons";
import {
  IconButton,
  toast,
  Tooltip,
  type UseDataTableReturn,
  usePrompt,
} from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTableBulkActionsToolbar } from "~/admin/components/bulk-actions-toolbar";
import { sdk } from "~/admin/lib/sdk";
import { Engine } from "~/modules/fitment/schema";

type EngineBulkActionsToolbarProps = {
  table: UseDataTableReturn<Engine>;
};

export function EngineBulkActionsToolbar({
  table,
}: EngineBulkActionsToolbarProps) {
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
      toast.success("Engines deleted successfully");
      // Clear row selection
      const selectedRows = table
        .getRowModel()
        .rows.filter((row) => row.getIsSelected());
      selectedRows.forEach((row) => row.toggleSelected(false));
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete engines");
    },
  });

  const handleBulkDelete = async () => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected());
    const selectedEngines = selectedRows.map((row) => row.original);
    const selectedIds = selectedEngines.map((e) => e.id);

    // Note: We don't have fitment count data on the Engine entity yet
    // This will be added in Phase 5
    const confirmed = await prompt({
      title: `Delete ${selectedIds.length} Engine${selectedIds.length > 1 ? "s" : ""}`,
      description: `Are you sure you want to delete ${selectedIds.length} engine${selectedIds.length > 1 ? "s" : ""}? This will also delete any associated fitments.`,
      confirmText: "Delete All",
      cancelText: "Cancel",
    });

    if (confirmed) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  return (
    <DataTableBulkActionsToolbar table={table} entityName="engine">
      <Tooltip content="Delete selected engines">
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
