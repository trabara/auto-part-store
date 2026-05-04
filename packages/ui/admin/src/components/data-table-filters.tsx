import { z } from "@medusajs/framework/zod";
import { createDataTableFilterHelper, DataTableFilter } from "@medusajs/ui";
import { FilterFieldOverrides } from "../types";
import { Entity } from "../types/data";
import { getZodFieldInfo, getZodShape } from "../utils";


export default function createZodDataTableFilterDef<
    S extends z.ZodObject,
    T extends Entity<z.infer<S>>,
>(schema: S, fields: FilterFieldOverrides<T>): DataTableFilter[] {
    const filterHelper = createDataTableFilterHelper<T>();

    const shape = getZodShape(schema);
    return Object.keys(fields).reduce((prevFields: DataTableFilter[], key) => {
        const field = fields[key as keyof T];
        if (!field?.isFiltrable) {
            return prevFields;
        }

        if (!shape[key]) {
            return prevFields;
        }

        const info = getZodFieldInfo(shape[key]);


        if (info.baseType === 'array' || info.baseType === 'enum') {
            const enumValues = (info.baseType === 'enum' ? info.enumValues : []) as string[];

            prevFields.push(
                filterHelper.accessor(key as any, {
                    label: field?.label || String(key),
                    type: "select",
                    options: enumValues.map((value) => ({
                        label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
                        value: value,
                    })),
                }) as any
            )

        } else {
            prevFields.push(
                filterHelper.accessor(key as any, {
                    label: field?.label || String(key),
                    type: "string",
                    placeholder: `Filter by ${field?.label || String(key)}`,
                }) as any
            )
        }

        return prevFields
    }, []);
}