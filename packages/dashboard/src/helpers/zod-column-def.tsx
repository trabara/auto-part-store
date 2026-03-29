import { Entity } from "@/types/data";
import { z } from "@medusajs/framework/zod";
import { EllipsisHorizontal, PencilSquare, Trash } from "@medusajs/icons";
import { DataTableColumnDef, DropdownMenu, IconButton } from '@medusajs/ui';
import { getZodShape } from "@snowpact/react-rhf-zod-form";
import { getZodFieldInfo } from "@snowpact/react-rhf-zod-form/src/utils";
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { CellOverride, MedusaFieldOverrides } from "../types/config";
import { createSelectDataTableColumns } from "./create-select-columns";

type SchemaConfig<S extends z.ZodTypeAny, T extends Entity = Entity<z.infer<S>>> = {
    schema: S,
    fields?: MedusaFieldOverrides<T>,
    onRowAction?: (action: string, row: T) => void,
}

export function createZodDataTableColumnDef<
    S extends z.ZodTypeAny,
    T extends Entity,
    K extends keyof T = keyof T
>(config: SchemaConfig<S, T>): DataTableColumnDef<T, K>[] {

    const { schema, fields } = config;

    return createSelectDataTableColumns<T, K>((columnHelper) => {

        const shape = getZodShape(schema);

        // Only include fields that are in the schema and specified in the fields array
        // columns must follow the fields order, so we iterate over the fields array and check if they exist in the schema

        const keys = fields && Object.keys(fields).length > 0 ? Object.keys(fields) as K[] : (Object.keys(shape) as K[]);

        const columns: DataTableColumnDef<T, K>[] = keys.map((key) => {
            const fieldInfo = getZodFieldInfo(shape[key]);
            const override = (fields?.[key] as CellOverride<T, K>)
            return columnHelper.accessor(key as any, {
                header: () => <span className="capitalize">{override?.label || String(key)}</span>,
                enableSorting: true,
                cell: (info) => {
                    if (override?.cell) {
                        // @ts-ignore
                        return override.cell(info);
                    }
                    const value = info.getValue<any>();
                    if (fieldInfo.baseType === "date") {
                        return format(new Date(value), "dd/MM/yyyy");
                    } if (fieldInfo.baseType === 'array') {
                        return <span>{value?.length}</span>
                    }
                    return String(value);
                }
            })
        })

        columns.push(columnHelper.display({
            id: "actions",
            size: 0,
            cell: (info) => {
                const { t } = useTranslation();
                return (
                    <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                            <IconButton variant="transparent" className="h-7 w-7 p-1">
                                <EllipsisHorizontal />
                            </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <DropdownMenu.Item className="[&_svg]:text-ui-fg-subtle flex items-center gap-x-2" onSelect={() => {
                                config.onRowAction?.("edit", info.row.original)
                            }}>
                                <PencilSquare />
                                <span>{t("common.edit")}</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className="[&_svg]:text-ui-fg-subtle flex items-center gap-x-2" onSelect={() => {
                                config.onRowAction?.("delete", info.row.original)
                            }}>
                                <Trash />
                                <span>{t("common.delete")}</span>
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu>
                )
            },
        }));

        return columns;
    })
}