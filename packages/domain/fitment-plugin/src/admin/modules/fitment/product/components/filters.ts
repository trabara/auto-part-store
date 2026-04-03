import { AdminProduct } from "@medusajs/framework/types"
import { createDataTableFilterHelper } from "@medusajs/ui"

const filterHelper = createDataTableFilterHelper<AdminProduct>()

export default [
    filterHelper.accessor("status", {
        label: "Status",
        type: "select",
        options: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
            { label: "Proposed", value: "proposed" },
            { label: "Rejected", value: "rejected" },
        ],
    }),
    filterHelper.accessor("title", {
        type: "string",
        label: "Title",
    }),
    filterHelper.accessor("handle", {
        type: "string",
        label: "Handle",
    }),
]
