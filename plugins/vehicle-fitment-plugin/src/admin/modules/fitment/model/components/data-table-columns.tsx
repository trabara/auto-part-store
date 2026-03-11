import { EllipsisHorizontal, Pencil, Trash } from "@medusajs/icons";
import { Badge, Button, DropdownMenu } from "@medusajs/ui";
import { format } from "date-fns";
import { TFunction } from "i18next";
import { createSelectDataTableColumns } from "../../../../helpers/create-select-columns";
import { ModelWithFitments } from "../types";

type CreateModelColumnsOptions = {
  onEdit?: (model: ModelWithFitments) => void;
  onDelete?: (model: ModelWithFitments) => void;
  t?: TFunction;
};

export function createModelColumns({
  onEdit,
  onDelete,
  t,
}: CreateModelColumnsOptions) {
  const tr = (key: string, options?: Record<string, unknown>) =>
    (t ? t(key, options as any) : key) as string;

  return createSelectDataTableColumns<ModelWithFitments>((columnHelper) => {
    return [
      columnHelper.accessor("name", {
        header: tr("model.column.name"),
        enableSorting: true,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-x-3">
            <span className="font-medium">{getValue()}</span>
          </div>
        ),
      }) as any,
      columnHelper.accessor("make.name", {
        header: tr("model.column.make"),
        enableSorting: true,
        cell: ({ getValue }) => (
          <Badge size="small" className="capitalize">
            {getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("fitments", {
        header: tr("model.column.fitments"),
        enableSorting: false,
        cell: ({ getValue }) => {
          const fitments = getValue() || [];
          return (
            <div className="text-ui-fg-subtle">
              {tr("model.column.fitments.count", {
                count: fitments.length,
              })}
            </div>
          );
        },
      }),
      columnHelper.accessor("created_at", {
        header: tr("model.column.createdAt"),
        enableSorting: true,
        cell: ({ getValue }) => {
          const date = new Date(getValue());
          return (
            <div className="text-ui-fg-subtle">{format(date, "PPP p")}</div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: tr("common.actions"),
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button variant="transparent" size="small">
                <EllipsisHorizontal />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item
                className="gap-x-2"
                onClick={() => onEdit?.(row.original)}
              >
                <Pencil className="size-4" />
                {tr("common.edit")}
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                className="gap-x-2"
                onClick={() => onDelete?.(row.original)}
              >
                <Trash className="size-4" />
                {tr("common.delete")}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        ),
      }),
    ];
  });
}
