import { z } from "@medusajs/framework/zod";
import { EllipsisHorizontal } from "@medusajs/icons";
import {
  Button,
  createDataTableColumnHelper,
  DataTableColumnDef,
  DropdownMenu,
  IconButton,
} from "@medusajs/ui";
import { getZodFieldInfo, getZodShape } from "@repo/utils";
import { format } from "date-fns";
import { startCase } from "lodash";
import React from "react";
import { FieldValues } from "react-hook-form";
import { FeatureFieldOverrides, RowAction } from "../types";

type ColumnDefConfig<T extends FieldValues> = {
  schema: z.ZodType<T>;
  overrides?: FeatureFieldOverrides<T>;
  actions?: RowAction<T>[];
};

function ensureZodObject<T extends FieldValues>(
  schema: z.ZodType<T>,
): z.ZodType<T> {
  const info = getZodFieldInfo(schema);

  if (info.baseType === "array") {
    const arraySchema = schema as unknown as z.ZodArray<z.ZodType<T>>;
    const elementSchema = arraySchema.element;
    const elementInfo = getZodFieldInfo(elementSchema);
    if (elementInfo.baseType === "object") {
      return elementSchema as z.ZodType<T>;
    }
  }
  return schema;
}

export function createZodDataTableColumnDef<
  T extends FieldValues,
  K extends keyof T = keyof T,
>(config: ColumnDefConfig<T>): DataTableColumnDef<T, K>[] {
  const { schema, overrides = {} as T, actions = [] } = config;

  const shape = getZodShape(ensureZodObject(schema));

  const helper = createDataTableColumnHelper<T>();
  const columns: DataTableColumnDef<T, K>[] = [helper.select()];

  // Only include fields that are in the schema and specified in the fields array
  // columns must follow the fields order, so we iterate over the fields array and check if they exist in the schema
  const shapeColumns = Object.keys(shape).reduce(
    (accessors, key) => {
      const fieldInfo = getZodFieldInfo(shape[key]!);

      const override = overrides?.[key];
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

  columns.push(...shapeColumns);

  if (actions.length > 0) {
    const actionColumn = helper.display({
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
                      {index < actions.length - 1 && <DropdownMenu.Separator />}
                    </React.Fragment>
                  );
                })}
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        );
      },
    });
    columns.push(actionColumn);
  }

  return columns;
}
