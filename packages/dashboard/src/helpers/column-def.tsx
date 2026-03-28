import { z } from "@medusajs/framework/zod";
import { DataTableColumnDef } from '@medusajs/ui';
import { getZodShape } from "@snowpact/react-rhf-zod-form";
import { getZodFieldInfo, resolveFieldType } from "@snowpact/react-rhf-zod-form/src/utils";
import { createSelectDataTableColumns } from "./create-select-columns";

export function createSchemaDataTableColumnDef<
    S extends z.ZodTypeAny,
    T = z.infer<S>,
    K extends keyof T = keyof T
>(schema: S, fields: K[] = []): DataTableColumnDef<T, any>[] {

    return createSelectDataTableColumns<T>((columnHelper) => {

        const shape = getZodShape(schema) as Record<K, z.ZodTypeAny>;

        // Only include fields that are in the schema and specified in the fields array
        // columns must follow the fields order, so we iterate over the fields array and check if they exist in the schema

        const keys = fields.length > 0 ? fields : (Object.keys(shape) as K[]);

        const columns = keys.map((key) => {
            const fieldInfo = getZodFieldInfo(shape[key]);
            const fieldType = resolveFieldType(fieldInfo);
            return columnHelper.accessor(key as any, {
                header: () => <span className="capitalize">{String(key)}</span>,
                enableSorting: true,
                cell: (info) => {
                    const value = info.getValue<any>();
                    if (fieldType === "date") {
                        return new Date(value).toLocaleDateString();
                    }
                    return String(value);
                }
            })
        })

        return columns;
    })
}