import { AdminProduct } from "@medusajs/framework/types"
import { createDataTableColumnHelper } from "@medusajs/ui"
const columnHelper = createDataTableColumnHelper<AdminProduct>()

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
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    status === "published" 
                        ? "bg-green-50 text-green-700" 
                        : status === "draft"
                        ? "bg-gray-50 text-gray-700"
                        : "bg-red-50 text-red-700"
                }`}>
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
]
