import { createDataTableColumnHelper } from "@medusajs/ui";
import { Fitment } from "~/modules/fitment/schema";

const columnHelper = createDataTableColumnHelper<Fitment>();

export const createColumns = (
  onEdit: (fitment: Fitment) => void,
  onDelete: (fitment: Fitment) => void,
) => [
  columnHelper.accessor("model.make.name", {
    header: "Make",
    enableSorting: true,
    sortLabel: "Make",
    sortAscLabel: "A-Z",
    sortDescLabel: "Z-A",
  }),
  columnHelper.accessor("model.name", {
    header: "Model",
    enableSorting: true,
    sortLabel: "Model",
    sortAscLabel: "A-Z",
    sortDescLabel: "Z-A",
  }),
  columnHelper.accessor("engine.size", {
    header: "Engine Size",
    enableSorting: true,
    sortLabel: "Engine Size",
    sortAscLabel: "Smallest-Largest",
    sortDescLabel: "Largest-Smallest",
  }),
  columnHelper.accessor("engine.fuel", {
    header: "Fuel Type",
    enableSorting: true,
    sortLabel: "Fuel Type",
    sortAscLabel: "A-Z",
    sortDescLabel: "Z-A",
  }),
  columnHelper.accessor("doors", {
    header: "Doors",
    enableSorting: true,
    sortLabel: "Doors",
    sortAscLabel: "Fewest-Most",
    sortDescLabel: "Most-Fewest",
  }),
  columnHelper.accessor("body_style", {
    header: "Body Style",
    enableSorting: true,
    sortLabel: "Body Style",
    sortAscLabel: "A-Z",
    sortDescLabel: "Z-A",
  }),
  columnHelper.accessor("drive", {
    header: "Drive Type",
    enableSorting: true,
    sortLabel: "Drive Type",
    sortAscLabel: "A-Z",
    sortDescLabel: "Z-A",
  }),
  columnHelper.accessor("transmission", {
    header: "Transmission",
    enableSorting: true,
    sortLabel: "Transmission",
    sortAscLabel: "A-Z",
    sortDescLabel: "Z-A",
  }),
  columnHelper.accessor("year_start", {
    header: "Year Start",
    enableSorting: true,
    sortLabel: "Year Start",
    sortAscLabel: "Oldest-Newest",
    sortDescLabel: "Newest-Oldest",
  }),
  columnHelper.accessor("year_end", {
    header: "Year End",
    enableSorting: true,
    sortLabel: "Year End",
    sortAscLabel: "Oldest-Newest",
    sortDescLabel: "Newest-Oldest",
  }),
  columnHelper.action({
    actions: [
      {
        label: "Edit",
        onClick: (context) => onEdit(context.row.original),
      },
      {
        label: "Delete",
        onClick: (context) => onDelete(context.row.original),
      },
    ],
  }),
];
