import { AdminProductListResponse } from "@medusajs/framework/types"
import { Button, Container, DataTable, DataTableFilteringState, DataTablePaginationState, DataTableSortingState, Heading, useDataTable } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import _ from "lodash"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "~/lib/sdk"
import columns from "./columns"
import filters from "./filters"
import { log } from "console"


const ProductList = ({ fitmentId }: { fitmentId?: string }) => {
    const navigate = useNavigate()


    const limit = 15
    const [pagination, setPagination] = useState<DataTablePaginationState>({
        pageSize: limit,
        pageIndex: 0,
    })
    const offset = useMemo(() => {
        return pagination.pageIndex * limit
    }, [pagination])

    const [search, setSearch] = useState<string>("")
    const [filtering, setFiltering] = useState<DataTableFilteringState>({})
    const [sorting, setSorting] = useState<DataTableSortingState | null>(null)

    const filterValues = useMemo(() => {
        let result: Record<string, any> = {}
        Object.keys(filtering).forEach((key) => {
            const value = filtering[key]
            if (value) {
                _.set(result, key, value)
            }
        })
        return result
    }, [filtering])

    const { data, isLoading } = useQuery<AdminProductListResponse>({
        queryFn: () => sdk.client.fetch<AdminProductListResponse>(`/admin/fitments/${fitmentId}/products`, {
            query: {
                limit,
                offset,
                fields: "*,*variants.*,collections.*",
                order: sorting ? `${sorting.id}:${sorting.desc ? "desc" : "asc"}` : undefined,
            }

        }),
        queryKey: [["products", limit, offset, search, filterValues, fitmentId, sorting?.id, sorting?.desc]],
    })
    console.log("data", data)
    const table = useDataTable({
        columns,
        filters,
        data: data?.products || [],
        getRowId: (row) => row.id,
        rowCount: data?.count || 0,
        isLoading,
        pagination: {
            state: pagination,
            onPaginationChange: setPagination,
        },
        search: {
            state: search,
            onSearchChange: setSearch,
            debounce: 2000,
        },
        filtering: {
            state: filtering,
            onFilteringChange: setFiltering,
        },
        sorting: {
            // Pass the pagination state and updater to the table instance
            state: sorting,
            onSortingChange: setSorting,
        },
        onRowClick: (event, row) =>
            navigate(`/products/${row.id}`)
    })

    return (
        <Container className="divide-y p-0">

            <DataTable instance={table}>
                <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
                    <Heading>Products</Heading>
                    <div className="flex items-center justify-center gap-x-2">
                        <Button variant="secondary" size="small" onClick={() => navigate('/fitments/create')}>Create</Button>
                    </div>
                </DataTable.Toolbar>

                <DataTable.Table />
                <DataTable.Pagination />
            </DataTable>
        </Container>
    )
}

export default ProductList