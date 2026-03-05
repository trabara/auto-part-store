import { Trash } from "@medusajs/icons";
import {
  IconButton,
  Tooltip,
  type UseDataTableReturn
} from "@medusajs/ui";
import { DataTableBulkActionsToolbar } from "../../../../components/bulk-actions-toolbar";
import { useModelDeleteMutation } from "../hooks/use-mode-delete";
import { ModelWithFitments } from "../types";

type ModelBulkActionsToolbarProps = {
  table: UseDataTableReturn<ModelWithFitments>;
};

export function ModelBulkActionsToolbar({
  table,
}: ModelBulkActionsToolbarProps) {

  // Bulk delete mutation
  const [bulkDeleteHandler, bulkDeleteMutation] = useModelDeleteMutation();

  const handleBulkDelete = async () => {
    const selectedModels = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original);

    bulkDeleteHandler(...selectedModels);
  };

  return (
    <DataTableBulkActionsToolbar table={table} entityName="model">
      <Tooltip content="Delete selected models">
        <IconButton
          size="large"
          className="rounded-none text-red-600"
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
