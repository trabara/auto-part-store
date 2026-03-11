import { Trash } from "@medusajs/icons";
import { IconButton, Tooltip, type UseDataTableReturn } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { DataTableBulkActionsToolbar } from "../../../../components/bulk-actions-toolbar";
import { useModelDeleteMutation } from "../hooks/use-model-delete";
import { ModelWithFitments } from "../types";

type ModelBulkActionsToolbarProps = {
  table: UseDataTableReturn<ModelWithFitments>;
};

export function ModelBulkActionsToolbar({
  table,
}: ModelBulkActionsToolbarProps) {
  const { t } = useTranslation();
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
      <Tooltip content={t("model.bulkDelete.tooltip")}>
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
