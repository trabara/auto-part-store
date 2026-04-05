import { IconButton, Tooltip, type UseDataTableReturn } from "@medusajs/ui";
import { Link, Unlink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProductLinkage } from "../hooks/use-product-linkage";
import { AdminProductWithFitments } from "../types";
import { DataTableBulkActionsToolbar } from "@repo/admin/components/bulk-actions-toolbar";

type FitmentBulkActionsToolbarProps = {
  table: UseDataTableReturn<AdminProductWithFitments>;
  fitmentId?: string;
};
export function ProductLinkageBulkActionsToolbar({
  table,
  fitmentId,
}: FitmentBulkActionsToolbarProps) {
  const { t } = useTranslation();
  const productLinkage = useProductLinkage({
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
          onClick={productLinkage.handleBulkLink}
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
          onClick={productLinkage.handleBulkUnlink}
        >
          <Unlink />
        </IconButton>
      </Tooltip>
    </DataTableBulkActionsToolbar>
  );
}
