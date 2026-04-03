
import {
    Checkbox,
    createDataTableColumnHelper,
    DataTableRowData,
    type DataTableColumnDef,
} from "@medusajs/ui";

type DataTableColumnHelper<TData extends DataTableRowData> = ReturnType<typeof createDataTableColumnHelper<TData>>;

type CreateColumnsCallback<TData extends DataTableRowData> = (columnHelper: DataTableColumnHelper<TData>) => Array<DataTableColumnDef<TData>>;

export function createSelectDataTableColumns<TData extends DataTableRowData>(createColumns: CreateColumnsCallback<TData>): Array<DataTableColumnDef<TData>> {
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
