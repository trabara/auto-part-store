import { z } from "@medusajs/framework/zod"
import { DataTableColumnDef } from "@medusajs/ui"
import { CellContext } from "@tanstack/react-table"
import { format } from "date-fns"
import { FieldValues } from "react-hook-form"
import { createSelectDataTableColumns } from "../lib/helpers/create-select-columns"
import { CellOverride, MedusaFieldOverrides, RowAction } from "../lib/types/config"
import { getZodFieldInfo, getZodShape } from "../lib/utils"
import { ActionCell } from "./action-cell"
import { startCase } from "lodash"

type ColumnDefConfig<T extends FieldValues> = {
  schema: z.ZodObject<T>
  fields?: MedusaFieldOverrides<T>
  actions?: RowAction<T>[]
}

export function createZodDataTableColumnDef<T extends FieldValues, K extends keyof T = keyof T>(
  config: ColumnDefConfig<T>,
): DataTableColumnDef<T, K>[] {
  const { schema, fields, actions } = config

  return createSelectDataTableColumns<T, K>((columnHelper) => {
    const shape = getZodShape(schema)

    // Only include fields that are in the schema and specified in the fields array
    // columns must follow the fields order, so we iterate over the fields array and check if they exist in the schema
    const keys =
      fields && Object.keys(fields).length > 0
        ? (Object.keys(fields) as K[])
        : (Object.keys(shape) as K[])

    const columns = keys.reduce(
      (prev, key) => {
        const fieldInfo = getZodFieldInfo(shape[key as string]!)
        const override = fields?.[key] as CellOverride<T, K>
        const label = startCase(override?.label || String(key))
        const accessor = columnHelper.accessor(key as any, {
          header: () => <span className="capitalize">{label}</span>,
          enableSorting: true,
          cell: (info) => {
            if (override?.cell) {
              return (override.cell as (props: CellContext<T, unknown>) => React.ReactNode)(info)
            }
            const value = info.getValue() as unknown
            if (!value) {
              return <span>-</span>
            }
            console.log(key,fieldInfo)
            if (fieldInfo.baseType === "date") {
              return format(new Date(value as string), "dd/MM/yyyy")
            }
            if (fieldInfo.baseType === "array") {
              return <span>{(value as unknown[]).length}</span>
            }
            return String(value)
          },
        })

        if (override && override.hideLabel) {
          return prev
        }

        prev.push(accessor)

        return prev
      },
      [] as DataTableColumnDef<T, K>[],
    )

    if (actions && actions.length > 0) {
      columns.push(
        columnHelper.display({
          id: "actions",
          cell: (info) => {
            return <ActionCell key={info.row.id} info={info} actions={actions} />
          },
        }),
      )
    }

    return columns
  })
}
