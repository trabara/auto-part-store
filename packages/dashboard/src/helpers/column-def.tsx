import { CellOverrides } from "@/types/config";
import { z } from "@medusajs/framework/zod";
import { EllipsisHorizontal, Pencil } from "@medusajs/icons";
import { DataTableColumnDef, DropdownMenu, IconButton } from '@medusajs/ui';
import { getZodShape } from "@snowpact/react-rhf-zod-form";
import { getZodFieldInfo, resolveFieldType } from "@snowpact/react-rhf-zod-form/src/utils";
import { format } from 'date-fns';
import { createSelectDataTableColumns } from "./create-select-columns";

type SchemaConfig<S extends z.AnyZodObject, T = z.infer<S>> = {
    schema: S,
    fields?: CellOverrides<T>
    onRowAction?: (action: string, row: T) => void,
}
export function createSchemaDataTableColumnDef<
    S extends z.AnyZodObject,
    T extends { id: string },
    K extends keyof T = keyof T
>(config: SchemaConfig<S, T>): DataTableColumnDef<T, K>[] {

    const { schema, fields } = config;

    return createSelectDataTableColumns<T, K>((columnHelper) => {

        const shape = getZodShape(schema) as Record<K, z.ZodTypeAny>;

        // Only include fields that are in the schema and specified in the fields array
        // columns must follow the fields order, so we iterate over the fields array and check if they exist in the schema

        const keys = fields && Object.keys(fields).length > 0 ? Object.keys(fields) as K[] : (Object.keys(shape) as K[]);

        const columns: DataTableColumnDef<T, K>[] = keys.map((key) => {
            const fieldInfo = getZodFieldInfo(shape[key]);
            const fieldType = resolveFieldType(fieldInfo);
            const override = fields?.[key]

            return columnHelper.accessor(key as any, {
                header: () => <span className="capitalize">{override?.label || String(key)}</span>,
                enableSorting: true,
                cell: (info) => {
                    if (override?.cell) {
                        // @ts-ignore
                        return override.cell(info as any);
                    }
                    const value = info.getValue<any>();
                    if (fieldType === "date") {
                        return format(new Date(value), "dd/MM/yyyy");
                    }
                    return String(value);
                }
            })
        })

        columns.push(columnHelper.display({
            id: "actions",
            header: "",
            size: 50,
            cell: (info) => {
                return (
                    <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                            <IconButton variant="transparent" size="small" className="p-2">
                                <EllipsisHorizontal />
                            </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <DropdownMenu.Item onSelect={() => {
                                config.onRowAction?.("edit", info.row.original)
                            }}>
                                <Pencil />
                                Edit
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu>
                )
            },
        }));

        return columns;
    })
}