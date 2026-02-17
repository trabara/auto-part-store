import { EllipsisHorizontal, Pencil, Trash } from "@medusajs/icons";
import {
  Button,
  Checkbox,
  createDataTableColumnHelper,
  DropdownMenu,
} from "@medusajs/ui";
import { format } from "date-fns";
import { MakeWithModels } from "../types";

const columnHelper = createDataTableColumnHelper<MakeWithModels>();

type CreateMakeColumnsProps = {
  onEdit?: (make: MakeWithModels) => void;
  onDelete?: (make: MakeWithModels) => void;
};
export const createMakeColumns = ({
  onEdit,
  onDelete,
}: CreateMakeColumnsProps) => [
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
      header: "Name",
      enableSorting: true,
      cell: ({ getValue }) => (
        <div className="flex items-center gap-x-3">
          <span className="font-medium">{getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("models", {
      header: "Models",
      enableSorting: false,
      cell: ({ getValue }) => {
        const models = getValue() || [];
        return (
          <div className="text-ui-fg-subtle">
            {models.length} {models.length === 1 ? "model" : "models"}
          </div>
        );
      },
    }),
    columnHelper.accessor("created_at", {
      header: "Created At",
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
      header: "Updated At",
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
      header: "Actions",
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
              Edit
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              className="gap-x-2"
              onClick={() => onDelete?.(row.original)}
            >
              <Trash className="size-4" />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      ),
    }),
  ];
