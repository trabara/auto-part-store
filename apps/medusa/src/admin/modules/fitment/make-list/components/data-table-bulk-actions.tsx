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
import { MakeWithModels } from "../types";

type MakeBulkActionsToolbarProps = {
  table: UseDataTableReturn<MakeWithModels>;
};

export function MakeBulkActionsToolbar({ table }: MakeBulkActionsToolbarProps) {
  const prompt = usePrompt();
  const queryClient = useQueryClient();

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = [];
      for (const id of ids) {
        const result = await sdk.client.fetch(`/admin/makes/${id}`, {
          method: "DELETE",
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["makes"] });
      toast.success("Makes deleted successfully");
      // Clear row selection
      const selectedRows = table
        .getRowModel()
        .rows.filter((row) => row.getIsSelected());
      selectedRows.forEach((row) => row.toggleSelected(false));
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete makes");
    },
  });

  const handleBulkDelete = async () => {
    const selectedRows = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected());
    const selectedMakes = selectedRows.map((row) => row.original);
    const selectedIds = selectedMakes.map((m) => m.id);

    // Calculate total models and estimated fitments that will be deleted
    const totalModels = selectedMakes.reduce((sum, make) => {
      return sum + (make.models?.length || 0);
    }, 0);

    const confirmed = await prompt({
      title: `Delete ${selectedIds.length} Make${selectedIds.length > 1 ? "s" : ""}`,
      description: `Are you sure you want to delete ${selectedIds.length} make${selectedIds.length > 1 ? "s" : ""}?${totalModels > 0 ? ` This will also delete ~${totalModels} model${totalModels > 1 ? "s" : ""} and their associated fitments.` : ""}`,
      confirmText: "Delete All",
      cancelText: "Cancel",
    });

    if (confirmed) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  return (
    <DataTableBulkActionsToolbar table={table} entityName="make">
      <Tooltip content="Delete selected makes">
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
