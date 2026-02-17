import { type UseDataTableReturn } from '@medusajs/ui';
import { useState } from "react";
import { DataTableBulkActionsToolbar } from "~/components/bulk-actions-toolbar";
import { AdminFitmentWithProducts } from "..";

type FitmentBulkActionsToolbarProps = {
    table: UseDataTableReturn<AdminFitmentWithProducts>
}
export function FitmentBulkActionsToolbar({
    table,
}: FitmentBulkActionsToolbarProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)


    return (
        <>
            <DataTableBulkActionsToolbar table={table} entityName='fitment'>
                <></>
            </DataTableBulkActionsToolbar>
        </>
    )
}