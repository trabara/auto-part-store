import { Trash } from "@medusajs/icons";
import {
  IconButton,
  Tooltip,
  type UseDataTableReturn
} from "@medusajs/ui";
import { DataTableBulkActionsToolbar } from "components/bulk-actions-toolbar";
import { useMakeDeleteMutation } from "../hooks/use-delete-mutation";
import { MakeWithModels } from "../types";

type MakeBulkActionsToolbarProps = {
  table: UseDataTableReturn<MakeWithModels>;
};

export function MakeBulkActionsToolbar({ table }: MakeBulkActionsToolbarProps) {
  // Bulk delete mutation
  const [bulkDeleteHandler, bulkDeleteMutation] = useMakeDeleteMutation();

  const handleBulkDelete = async () => {
    const selectedMakes = table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original);

    bulkDeleteHandler(...selectedMakes);
  };

  return (
    <DataTableBulkActionsToolbar table={table} entityName="make">
      <Tooltip content="Delete selected makes">
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
