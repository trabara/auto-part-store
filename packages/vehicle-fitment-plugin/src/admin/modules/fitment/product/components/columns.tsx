import { Badge, Checkbox, createDataTableColumnHelper } from "@medusajs/ui";
import { AdminProductWithFitments } from "../types";
import { Link, Unlink } from "lucide-react";
const columnHelper = createDataTableColumnHelper<
  AdminProductWithFitments
>();

type CreateProductColumns = {
  fitmentId?: string;
  onLinkProduct?: (id: string) => void;
  onUnlinkProduct?: (id: string) => void;
};

export const createProductColumns = ({ onLinkProduct, onUnlinkProduct }: CreateProductColumns) => {
  const baseColumns = [];

  // Add checkbox column if showing all products

  baseColumns.push(
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
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
  );


  // Standard product columns
  baseColumns.push(
    columnHelper.accessor("title", {
      header: "Title",
      cell: ({ getValue }) => getValue(),
    }),
    columnHelper.accessor("subtitle", {
      header: "Subtitle",
      cell: ({ getValue }) => getValue() || "-",
    }),
    columnHelper.accessor("handle", {
      header: "Handle",
      cell: ({ getValue }) => getValue(),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue();
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${status === "published"
              ? "bg-green-50 text-green-700"
              : status === "draft"
                ? "bg-gray-50 text-gray-700"
                : "bg-red-50 text-red-700"
              }`}
          >
            {status}
          </span>
        );
      },
    }),
    columnHelper.accessor("collection", {
      header: "Collection",
      cell: ({ getValue }) => {
        const collection = getValue();
        return collection?.title || "-";
      },
    }),
    columnHelper.accessor("variants", {
      header: "Variants",
      cell: ({ getValue }) => {
        const variants = getValue();
        return variants?.length || 0;
      },
    }),
  );

  // Add link status badge if showing all products

  baseColumns.push(
    columnHelper.accessor("isLinked", {
      header: "Link Status",
      cell: ({ getValue }) => {
        const isLinked = getValue();
        return (
          <Badge color={isLinked ? "green" : "grey"} size="small">
            {isLinked ? "Linked" : "Not Linked"}
          </Badge>
        );
      },
    }),
  );
  // Add actions column if showing all products

  baseColumns.push(
    columnHelper.action({
      actions: (context) => {
        const { isLinked } = context.row.original;
        const Icon = (props: React.ComponentProps<"svg">) => isLinked ? <Unlink {...props} /> : <Link {...props} />;
        return [
          {
            label: isLinked ? "Unlink" : "Link",
            icon: <Icon className="size-4"/>,
            onClick: () => {
              const product = context.row.original;
              if (product.isLinked) {
                onUnlinkProduct?.(product.id);
              } else {
                onLinkProduct?.(product.id);
              }
            },
          }
        ]
      },
    }),
  );

  return baseColumns;
}


// Export default for backward compatibility
export default [
  columnHelper.accessor("title", {
    header: "Title",
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor("subtitle", {
    header: "Subtitle",
    cell: ({ getValue }) => getValue() || "-",
  }),
  columnHelper.accessor("handle", {
    header: "Handle",
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${status === "published"
            ? "bg-green-50 text-green-700"
            : status === "draft"
              ? "bg-gray-50 text-gray-700"
              : "bg-red-50 text-red-700"
            }`}
        >
          {status}
        </span>
      );
    },
  }),
  columnHelper.accessor("collection", {
    header: "Collection",
    cell: ({ getValue }) => {
      const collection = getValue();
      return collection?.title || "-";
    },
  }),
  columnHelper.accessor("variants", {
    header: "Variants",
    cell: ({ getValue }) => {
      const variants = getValue();
      return variants?.length || 0;
    },
  }),
];
