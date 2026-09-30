import { z } from "@medusajs/framework/zod";
import { EllipsisHorizontal } from "@medusajs/icons";
import {
  Button,
  DataTableColumnDef,
  DropdownMenu,
  IconButton,
} from "@medusajs/ui";
import { format } from "date-fns";
import { startCase } from "lodash";
import React from "react";
import { FieldValues } from "react-hook-form";
import { FeatureFieldOverrides, RowAction } from "../types";
import { createSelectDataTableColumns } from "./create-select-columns";
import { getZodFieldInfo, getZodShape } from "@repo/utils";

type ColumnDefConfig<T extends FieldValues> = {
  schema: z.ZodObject<T>;
  fields?: FeatureFieldOverrides<T>;
  actions?: RowAction<T>[];
};

export function createZodDataTableColumnDef<
  T extends FieldValues,
  K extends keyof T = keyof T,
>(config: ColumnDefConfig<T>): DataTableColumnDef<T, K>[] {
  const { schema, fields = {} as T, actions = [] } = config;

  return createSelectDataTableColumns<T, K>((helper) => {
    const shape = getZodShape(schema);

    // Only include fields that are in the schema and specified in the fields array
    // columns must follow the fields order, so we iterate over the fields array and check if they exist in the schema
    const columns = Object.keys(shape).reduce(
      (accessors, key) => {
        const fieldInfo = getZodFieldInfo(shape[key]!);

        const override = fields?.[key];
        // if (!override) {
        //   return accessors;
        // }

        if (override && override.hideLabel) {
          return accessors;
        }

        const label = startCase(override?.label || String(key));
        const accessor = helper.accessor(key as any, {
          header: () => <span className="capitalize">{label}</span>,
          enableSorting: override ? override?.enableSorting : false,
          sortLabel: label,
          cell: (info) => {
            if (override?.cell) {
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

        accessors.push(accessor);
        return accessors;
      },
      [] as DataTableColumnDef<T, K>[],
    );

    let column = null;
    if (actions.length > 0) {
      column = helper.display({
        id: "actions",
        cell: (info) => {
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <IconButton variant="transparent">
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
                              size="small"
                              variant="transparent"
                              className="w-full justify-start"
                              onClick={(e) =>
                                action.onClick?.(e, info.row.original)
                              }
                            >
                              {action.icon}
                              <span>{action.label}</span>
                            </Button>
                          )}
                        </DropdownMenu.Item>
                        {index < actions.length - 1 && (
                          <DropdownMenu.Separator />
                        )}
                      </React.Fragment>
                    );
                  })}
                </DropdownMenu.Content>
              </DropdownMenu>
            </div>
          );
        },
      });
    }

    if (column) {
      columns.push(column);
    }
    return columns;
  });
}
