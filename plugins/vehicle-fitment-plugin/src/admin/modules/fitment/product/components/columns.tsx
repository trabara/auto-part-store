import { Badge, Checkbox, createDataTableColumnHelper } from "@medusajs/ui";
import { TFunction } from "i18next";
import { Link, Unlink } from "lucide-react";
import { AdminProductWithFitments } from "../types";
const columnHelper = createDataTableColumnHelper<AdminProductWithFitments>();

type CreateProductColumns = {
  fitmentId?: string;
  onLinkProduct?: (id: string) => void;
  onUnlinkProduct?: (id: string) => void;
  t?: TFunction;
};

export const createProductColumns = ({
  onLinkProduct,
  onUnlinkProduct,
  t,
}: CreateProductColumns) => {
  const tr = (key: string, options?: Record<string, unknown>) =>
    (t ? t(key, options as any) : key) as string;

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
  );

  // Standard product columns
  baseColumns.push(
    columnHelper.accessor("title", {
      header: tr("product.column.title"),
      cell: ({ getValue }) => getValue(),
    }),
    columnHelper.accessor("subtitle", {
      header: tr("product.column.subtitle"),
      cell: ({ getValue }) => getValue() || "-",
    }),
    columnHelper.accessor("handle", {
      header: tr("product.column.handle"),
      cell: ({ getValue }) => getValue(),
    }),
    columnHelper.accessor("status", {
      header: tr("product.column.status"),
      cell: ({ getValue }) => {
        const status = getValue();
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              status === "published"
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
      header: tr("product.column.collection"),
      cell: ({ getValue }) => {
        const collection = getValue();
        return collection?.title || "-";
      },
    }),
    columnHelper.accessor("variants", {
      header: tr("product.column.variants"),
      cell: ({ getValue }) => {
        const variants = getValue();
        return variants?.length || 0;
      },
    }),
  );

  // Add link status badge if showing all products

  baseColumns.push(
    columnHelper.accessor("isLinked", {
      header: tr("product.column.linkStatus"),
      cell: ({ getValue }) => {
        const isLinked = getValue();
        return (
          <Badge color={isLinked ? "green" : "grey"} size="small">
            {isLinked
              ? tr("product.column.linked")
              : tr("product.column.notLinked")}
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
        const Icon = (props: React.ComponentProps<"svg">) =>
          isLinked ? <Unlink {...props} /> : <Link {...props} />;
        return [
          {
            label: isLinked ? tr("common.unlink") : tr("common.link"),
            icon: <Icon className="size-4" />,
            onClick: () => {
              const product = context.row.original;
              if (product.isLinked) {
                onUnlinkProduct?.(product.id);
              } else {
                onLinkProduct?.(product.id);
              }
            },
          },
        ];
      },
    }),
  );

  return baseColumns;
};

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
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            status === "published"
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
