import { EllipsisHorizontal } from "@medusajs/icons"
import { Button, DropdownMenu, IconButton } from "@medusajs/ui"
import { CellContext } from "@tanstack/react-table"
import React from "react"
import { FieldValues } from "react-hook-form"
import { RowAction } from "../types"

export const ActionCell = <TData extends FieldValues, TValue>({
  info,
  actions,
}: {
  info: CellContext<TData, TValue>
  actions: RowAction<TData>[]
}) => {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton variant="transparent" className="h-7 w-7 p-1">
          <EllipsisHorizontal />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {actions.map((action, index) => {
          return (
            <React.Fragment key={action.id}>
              <DropdownMenu.Item
                className="[&_svg]:text-ui-fg-subtle flex items-center gap-x-2"
                asChild
              >
                {action.render ? (
                  action.render(info.row.original)
                ) : (
                  <Button
                    variant="transparent"
                    size="small"
                    className="w-full justify-start"
                    onClick={() => action.onClick?.(info.row.original)}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </Button>
                )}
              </DropdownMenu.Item>
              {index < actions.length - 1 && <DropdownMenu.Separator />}
            </React.Fragment>
          )
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
