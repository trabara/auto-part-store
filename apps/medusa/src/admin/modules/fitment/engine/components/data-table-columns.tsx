import { EllipsisHorizontal, Pencil, Trash } from "@medusajs/icons";
import { Button, DropdownMenu } from "@medusajs/ui";
import { format } from "date-fns";
import { createSelectDataTableColumns } from "~/admin/lib/helpers/create-select-columns";
import { Engine } from "~/modules/fitment/schema";

type CreateEngineColumnsOptions = {
  onEdit?: (engine: Engine) => void;
  onDelete?: (engine: Engine) => void;
};

const FUEL_LABELS: Record<string, string> = {
  GASOLINE: "Gasoline",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
};

export function createEngineColumns({ onEdit, onDelete }: CreateEngineColumnsOptions) {
  return createSelectDataTableColumns<Engine>((columnHelper) => [
    columnHelper.accessor("fuel", {
      header: "Fuel Type",
      enableSorting: true,
      cell: ({ getValue }) => {
        const fuel = getValue<string>()
        return <span className="font-medium">{FUEL_LABELS[fuel] || fuel}</span>;
      },
    }) as any,
    columnHelper.accessor("type", {
      header: "Engine Type",
      enableSorting: true,
      cell: ({ getValue }) => <span>{getValue()}</span>,
    }),
    columnHelper.accessor("size", {
      header: "Size",
      enableSorting: true,
      cell: ({ getValue }) => <span>{getValue()}L</span>,
    }),
    columnHelper.accessor("tech", {
      header: "Technology",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-ui-fg-subtle">{getValue() || "-"}</span>
      ),
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
  ])
}
