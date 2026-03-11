import { EllipsisHorizontal, Pencil, Trash } from "@medusajs/icons";
import { Button, DropdownMenu } from "@medusajs/ui";
import { format } from "date-fns";
import { TFunction } from "i18next";
import { Engine } from "../../../../../modules/fitment/schema";
import { createSelectDataTableColumns } from "../../../../helpers/create-select-columns";

type CreateEngineColumnsOptions = {
  onEdit?: (engine: Engine) => void;
  onDelete?: (engine: Engine) => void;
  t?: TFunction;
};

const FUEL_LABELS: Record<string, string> = {
  GASOLINE: "Gasoline",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
};

export function createEngineColumns({
  onEdit,
  onDelete,
  t,
}: CreateEngineColumnsOptions) {
  const tr = (key: string, options?: Record<string, unknown>) =>
    (t ? t(key, options as any) : key) as string;

  return createSelectDataTableColumns<Engine>((columnHelper) => [
    columnHelper.accessor("fuel", {
      header: tr("engine.column.fuelType"),
      enableSorting: true,
      cell: ({ getValue }) => {
        const fuel = getValue<string>();
        return <span className="font-medium">{FUEL_LABELS[fuel] || fuel}</span>;
      },
    }) as any,
    columnHelper.accessor("type", {
      header: tr("engine.column.engineType"),
      enableSorting: true,
      cell: ({ getValue }) => <span>{getValue()}</span>,
    }),
    columnHelper.accessor("size", {
      header: tr("engine.column.size"),
      enableSorting: true,
      cell: ({ getValue }) => <span>{getValue()}L</span>,
    }),
    columnHelper.accessor("tech", {
      header: tr("engine.column.technology"),
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-ui-fg-subtle">{getValue() || "-"}</span>
      ),
    }),
    columnHelper.accessor("created_at", {
      header: tr("engine.column.createdAt"),
      enableSorting: true,
      cell: ({ getValue }) => {
        const date = new Date(getValue());
        return <div className="text-ui-fg-subtle">{format(date, "PPP p")}</div>;
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
  ]);
}
