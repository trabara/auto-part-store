import { EllipsisHorizontal, Pencil, Trash } from "@medusajs/icons";
import {
  Button,
  Checkbox,
  createDataTableColumnHelper,
  DropdownMenu,
} from "@medusajs/ui";
import { format } from "date-fns";
import { TFunction } from "i18next";
import { MakeWithModels } from "../types";

const columnHelper = createDataTableColumnHelper<MakeWithModels>();

type CreateMakeColumnsProps = {
  onEdit?: (make: MakeWithModels) => void;
  onDelete?: (make: MakeWithModels) => void;
  t?: TFunction;
};
export const createMakeColumns = ({
  onEdit,
  onDelete,
  t,
}: CreateMakeColumnsProps) => {
  const tr = (key: string, options?: Record<string, unknown>) =>
    (t ? t(key, options as any) : key) as string;

  return [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    }),
    columnHelper.accessor("name", {
      header: tr("make.column.name"),
      enableSorting: true,
      cell: ({ getValue }) => (
        <div className="flex items-center gap-x-3">
          <span className="font-medium">{getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("models", {
      header: tr("make.column.models"),
      enableSorting: false,
      cell: ({ getValue }) => {
        const models = getValue() || [];
        return (
          <div className="text-ui-fg-subtle">
            {tr("make.column.models.count", { count: models.length })}
          </div>
        );
      },
    }),
    columnHelper.accessor("created_at", {
      header: tr("make.column.createdAt"),
      enableSorting: true,
      cell: ({ getValue }) => {
        return (
          <div className="text-ui-fg-subtle">
            {format(new Date(getValue()), "PPP p")}
          </div>
        );
      },
    }),
    columnHelper.accessor("updated_at", {
      header: tr("make.column.updatedAt"),
      enableSorting: true,
      cell: ({ getValue }) => {
        return (
          <div className="text-ui-fg-subtle">
            {format(new Date(getValue()), "PPP p")}
          </div>
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
};
