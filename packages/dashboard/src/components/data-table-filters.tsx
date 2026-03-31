import { z } from "@medusajs/framework/zod";
import { DataTableFilter } from "@medusajs/ui";
import { getZodShape } from "@snowpact/react-rhf-zod-form";
import { getZodFieldInfo } from "@snowpact/react-rhf-zod-form/src/utils";
import { Entity } from "../types/data";

const TYPES: Record<string, string> = {
    array: 'select',
    string: "string",
    number: "number",
    boolean: "boolean",
    date: "date",
    enum: "select",
}
type FilterFieldOverride = {
    label?: string;
    options?: {
        label: string;
        value: string | number;
    }
}

type FilterFieldOverrides<T> = Record<keyof T, FilterFieldOverride>;

export default function createZodDataTableFilterDef<
    S extends z.AnyZodObject,
    T extends Entity<z.infer<S>>,
>(schema: S, fields: FilterFieldOverrides<T>): DataTableFilter[] {
    const shape = getZodShape(schema);

    return Object.keys(shape).reduce<DataTableFilter[]>((prevFields, key) => {
        const info = getZodFieldInfo(shape[key]!);

        if (info.baseType === 'array' || info.baseType === 'enum') {
            const enumValues = info.baseType === 'enum' ? info.enumValues : [];


        }


        return prevFields

    }, []);
}