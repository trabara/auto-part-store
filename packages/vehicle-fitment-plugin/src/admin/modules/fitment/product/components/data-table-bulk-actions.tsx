import { IconButton, Tooltip, type UseDataTableReturn } from "@medusajs/ui";
import { Link, Unlink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DataTableBulkActionsToolbar } from "../../../../components/bulk-actions-toolbar";
import { useProductLinking } from "../hooks/use-product-linking";
import { AdminProductWithFitments } from "../types";

type FitmentBulkActionsToolbarProps = {
  table: UseDataTableReturn<AdminProductWithFitments>;
  fitmentId?: string;
};
export function ProductLinkageBulkActionsToolbar({
  table,
  fitmentId,
}: FitmentBulkActionsToolbarProps) {
  const { t } = useTranslation();
  const productLinking = useProductLinking({
    fitmentId: fitmentId || "",
    selectedProducts: table
      .getRowModel()
      .rows.filter((row) => row.getIsSelected())
      .map((row) => row.original),
  });

  return (
    <DataTableBulkActionsToolbar table={table} entityName="fitment">
      <Tooltip content={t("product.bulk.linkTooltip")}>
        <IconButton
          className="rounded-none"
          size="large"
          variant="transparent"
          onClick={productLinking.handleBulkLink}
        >
          <Link />
        </IconButton>
      </Tooltip>
      <div className="bg-ui-contrast-border-base h-10 w-px"></div>
      <Tooltip content={t("product.bulk.unlinkTooltip")}>
        <IconButton
          className="rounded-none"
          size="large"
          variant="transparent"
          onClick={productLinking.handleBulkUnlink}
        >
          <Unlink />
        </IconButton>
      </Tooltip>
    </DataTableBulkActionsToolbar>
  );
}
