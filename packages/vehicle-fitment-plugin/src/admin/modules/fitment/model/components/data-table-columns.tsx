import { EllipsisHorizontal, Pencil, Trash } from "@medusajs/icons";
import { Badge, Button, DropdownMenu } from "@medusajs/ui";
import { format } from "date-fns";
import { createSelectDataTableColumns } from "../../../../helpers/create-select-columns";
import { ModelWithFitments } from "../types";

type CreateModelColumnsOptions = {
  onEdit?: (model: ModelWithFitments) => void;
  onDelete?: (model: ModelWithFitments) => void;
};

export function createModelColumns({ onEdit, onDelete }: CreateModelColumnsOptions) {
  return createSelectDataTableColumns<ModelWithFitments>((columnHelper) => {

    return [
      columnHelper.accessor("name", {
        header: "Model Name",
        enableSorting: true,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-x-3">
            <span className="font-medium">{getValue()}</span>
          </div>
        ),
      }) as any,
      columnHelper.accessor("make.name", {
        header: "Make",
        enableSorting: true,
        cell: ({ getValue }) => (
          <Badge size="small" className="capitalize">
            {getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("fitments", {
        header: "Fitments",
        enableSorting: false,
        cell: ({ getValue }) => {
          const fitments = getValue() || [];
          return (
            <div className="text-ui-fg-subtle">
              {fitments.length} {fitments.length === 1 ? "fitment" : "fitments"}
            </div>
          );
        },
      }),
      columnHelper.accessor("created_at", {
        header: "Created At",
        enableSorting: true,
        cell: ({ getValue }) => {
          const date = new Date(getValue());
          return <div className="text-ui-fg-subtle">{format(date, "PPP p")}</div>;
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
    ]
  });
}
