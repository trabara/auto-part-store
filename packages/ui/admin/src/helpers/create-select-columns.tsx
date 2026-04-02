
import {
    Checkbox,
    createDataTableColumnHelper,
    DataTableRowData,
    type DataTableColumnDef,
} from "@medusajs/ui";

type DataTableColumnHelper<TData extends DataTableRowData, TValue> = ReturnType<typeof createDataTableColumnHelper<TData>>;

type CreateColumnsCallback<TData extends DataTableRowData, TValue> = (columnHelper: DataTableColumnHelper<TData, TValue>) => Array<DataTableColumnDef<TData, TValue>>;

export function createSelectDataTableColumns<TData extends DataTableRowData, TValue = unknown>(createColumns: CreateColumnsCallback<TData, TValue>): Array<DataTableColumnDef<TData, TValue>> {
    const columnHelper = createDataTableColumnHelper<TData>();
    return [
        columnHelper.display({
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
        }),
        ...createColumns(columnHelper)
    ];
}
