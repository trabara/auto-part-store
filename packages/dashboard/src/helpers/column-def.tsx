import { CellOverrides } from "@/types/config";
import { z } from "@medusajs/framework/zod";
import { DataTableColumnDef } from '@medusajs/ui';
import { getZodShape } from "@snowpact/react-rhf-zod-form";
import { getZodFieldInfo, resolveFieldType } from "@snowpact/react-rhf-zod-form/src/utils";
import { format } from 'date-fns';
import { createSelectDataTableColumns } from "./create-select-columns";

export function createSchemaDataTableColumnDef<
    S extends z.ZodTypeAny,
    T extends { id: string },
    K extends keyof T = keyof T
>(schema: S, fields?: CellOverrides<T>): DataTableColumnDef<T, K>[] {

    return createSelectDataTableColumns<T>((columnHelper) => {

        const shape = getZodShape(schema) as Record<K, z.ZodTypeAny>;

        // Only include fields that are in the schema and specified in the fields array
        // columns must follow the fields order, so we iterate over the fields array and check if they exist in the schema

        const keys = fields && Object.keys(fields).length > 0 ? Object.keys(fields) as K[] : (Object.keys(shape) as K[]);

        const columns = keys.map((key) => {
            const fieldInfo = getZodFieldInfo(shape[key]);
            const fieldType = resolveFieldType(fieldInfo);
            const override = fields?.[key]

            // if (override) {
            //     return columnHelper.accessor(key as any, {
            //         header: () => <span className="capitalize">{override.label}</span>,
            //         enableSorting: true,
            //         cell: override.cell,
            //     })
            // }

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

        return columns;
    })
}