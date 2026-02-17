import { IconButton, Tooltip, type UseDataTableReturn } from "@medusajs/ui"
import { Link, Unlink } from "lucide-react"
import { useEffect, useState } from "react"
import { DataTableBulkActionsToolbar } from "~/components/bulk-actions-toolbar"
import { useProductLinking } from "../hooks/use-product-linking"
import { AdminProductWithFitments } from "../types"

type FitmentBulkActionsToolbarProps = {
    table: UseDataTableReturn<AdminProductWithFitments>
    fitmentId?: string
}
export function ProductLinkageBulkActionsToolbar({
    table,
    fitmentId,
}: FitmentBulkActionsToolbarProps) {
    const productLinking = useProductLinking({
        fitmentId: fitmentId || "",
    });

    const selectedProducts = table.getRowModel().rows
        .filter((row) => row.getIsSelected())

    useEffect(() => {

        productLinking.setRowSelection(
            selectedProducts.reduce((acc, row) => {
                acc[row.original.id] = true
                return acc
            }, {} as Record<string, boolean>)
        )

    }, [selectedProducts, table])

    return (

        <DataTableBulkActionsToolbar table={table} entityName='fitment'>
            <Tooltip content="Link selected products to fitment">
                <IconButton className="rounded-none" size="large" variant="transparent" onClick={productLinking.handleBulkLink}>
                    <Link />
                </IconButton>
            </Tooltip>
            <div className="bg-ui-contrast-border-base h-10 w-px"></div>
            <Tooltip content="Unlink selected products from fitment">
                <IconButton className="rounded-none" size="large" variant="transparent" onClick={productLinking.handleBulkUnlink}>
                    <Unlink />
                </IconButton>
            </Tooltip>
        </DataTableBulkActionsToolbar>
    )
}