import {
  IconButton,
  Tooltip,
  type UseDataTableReturn,
  usePrompt,
  toast,
} from "@medusajs/ui";
import { Trash } from "@medusajs/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "~/admin/lib/sdk";
import { DataTableBulkActionsToolbar } from "~/admin/components/bulk-actions-toolbar";
import { AdminFitmentWithProducts } from "..";

type FitmentBulkActionsToolbarProps = {
  table: UseDataTableReturn<AdminFitmentWithProducts>;
};
export function FitmentBulkActionsToolbar({
  table,
}: FitmentBulkActionsToolbarProps) {
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
      toast.success("Fitments deleted successfully");
      // Clear row selection
      const selectedRows = table
        .getRowModel()
        .rows.filter((row) => row.getIsSelected());
      selectedRows.forEach((row) => row.toggleSelected(false));
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete fitments");
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
      title: `Delete ${selectedIds.length} Fitment${selectedIds.length > 1 ? "s" : ""}`,
      description: `Are you sure you want to delete ${selectedIds.length} fitment${selectedIds.length > 1 ? "s" : ""}?${totalProductLinks > 0 ? ` This will also remove ~${totalProductLinks} product link${totalProductLinks > 1 ? "s" : ""}.` : ""}`,
      confirmText: "Delete All",
      cancelText: "Cancel",
    });

    if (confirmed) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  return (
    <>
      <DataTableBulkActionsToolbar table={table} entityName="fitment">
        <Tooltip content="Delete selected fitments">
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
