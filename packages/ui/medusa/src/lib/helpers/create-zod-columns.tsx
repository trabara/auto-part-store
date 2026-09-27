import { z } from "@medusajs/framework/zod";
import { DataTableColumnDef } from "@medusajs/ui";
import { format } from "date-fns";
import { merge, remove, startCase } from "lodash";
import { FieldValues } from "react-hook-form";
import { createSelectDataTableColumns } from "./create-select-columns";
import { MedusaFieldOverrides, RowAction } from "../types/config";
import { getZodFieldInfo, getZodShape } from "../utils";
import { ActionCell } from "../../components/action-cell";

type ColumnDefConfig<T extends FieldValues> = {
  schema: z.ZodObject<T>;
  fields?: MedusaFieldOverrides<T>;
  actions?: RowAction<T>[];
};

export function createZodDataTableColumnDef<
  T extends FieldValues,
  K extends keyof T = keyof T,
>(config: ColumnDefConfig<T>): DataTableColumnDef<T, K>[] {
  const { schema, fields = {} as T, actions } = config;

  return createSelectDataTableColumns<T, K>((columnHelper) => {
    const shape = getZodShape(schema);

    const timestamps = ["created_at", "updated_at", "deleted_at"];
    const keys = remove(
      merge(Object.keys(fields), Object.keys(shape)),
      (k) => !timestamps.includes(k),
    );

    keys.push(...timestamps);

    // Only include fields that are in the schema and specified in the fields array
    // columns must follow the fields order, so we iterate over the fields array and check if they exist in the schema
    const columns = keys.reduce(
      (prev, key) => {
        const fieldInfo = getZodFieldInfo(shape[key]!);

        const override = fields?.[key];

        const label = startCase(override?.label || String(key));

        const accessor = columnHelper.accessor(key as any, {
          header: () => <span className="capitalize">{label}</span>,
          enableSorting: true,
          cell: (info) => {
            if (override?.cell) {
              //@ts-ignore
              return override.cell(info);
            }
            const value = info.getValue() as unknown;
            if (!value) {
              return <span>-</span>;
            }
            if (fieldInfo.baseType === "date") {
              return format(new Date(value as string), "dd/MM/yyyy");
            }
            if (fieldInfo.baseType === "array") {
              return <span>{(value as unknown[]).length}</span>;
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
