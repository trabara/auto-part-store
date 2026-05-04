import { z } from "@medusajs/framework/zod";
import { DataTableColumnDef } from "@medusajs/ui";
import { format } from "date-fns";
import { createSelectDataTableColumns } from "../helpers/create-select-columns";
import { Entity } from "../types";
import { CellOverride, MedusaFieldOverrides, RowAction } from "../types/config";
import { getZodFieldInfo, getZodShape } from "../utils";
import ActionCell from "./action-cell";

type ColumnDefConfig<
  S extends z.ZodObject,
  T extends Entity = Entity<z.infer<S>>,
> = {
  schema: S;
  fields?: MedusaFieldOverrides<T>;
  actions?: RowAction<T>[];
};

export function createZodDataTableColumnDef<
  S extends z.ZodObject,
  T extends Entity = Entity<z.infer<S>>,
  K extends keyof T = keyof T,
>(config: ColumnDefConfig<S, T>): DataTableColumnDef<T, K>[] {
  const { schema, fields, actions } = config;

  return createSelectDataTableColumns<T, K>((columnHelper) => {
    const shape = getZodShape(schema);

    // Only include fields that are in the schema and specified in the fields array
    // columns must follow the fields order, so we iterate over the fields array and check if they exist in the schema
    const keys =
      fields && Object.keys(fields).length > 0
        ? (Object.keys(fields) as K[])
        : (Object.keys(shape) as K[]);

    const columns = keys.reduce(
      (prev, key) => {
        const fieldInfo = getZodFieldInfo(shape[key as string]!);
        const override = fields?.[key] as CellOverride<T, K>;
        const accessor = columnHelper.accessor(key as any, {
          header: () => (
            <span className="capitalize">{override?.label || String(key)}</span>
          ),
          enableSorting: true,
          cell: (info) => {
            if (override?.cell) {
              // @ts-ignore
              return override.cell(info);
            }
            const value = info.getValue<any>();
            if (!value) {
              return <span>-</span>;
            }
            if (fieldInfo.baseType === "date") {
              return format(new Date(value), "dd/MM/yyyy");
            }
            if (fieldInfo.baseType === "array") {
              return <span>{value?.length}</span>;
            }
            return String(value);
          },
        });

        if (override && override.hideLabel) {
          return prev;
        }

        prev.push(accessor);

        return prev;
      },
      [] as DataTableColumnDef<T, K>[],
    );

    if (actions && actions.length > 0) {
      columns.push(
        columnHelper.display({
          id: "actions",
          cell: (info) => {
            return (
              <ActionCell key={info.row.id} info={info} actions={actions} />
            );
          },
        }),
      );
    }

    return columns;
  });
}
