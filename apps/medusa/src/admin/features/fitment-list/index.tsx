import { Button, Container, DataTable, DataTableFilteringState, DataTablePaginationState, DataTableSortingState, Heading, useDataTable } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import _ from "lodash"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "~/lib/sdk"
import { Fitment } from "~/modules/fitment/schema"
import columns from "./columns"
import filters from "./filters"

type FitmentResponse = {
    fitments: Fitment[],
    metadata: {
        count: number,
        offset: number,
        limit: number,
    }
}

const FitmentList = () => {
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

    const { data, isLoading } = useQuery<FitmentResponse>({
        queryFn: () => sdk.client.fetch<FitmentResponse>(`/admin/fitments`, {
            query: {
                limit,
                offset,
                fields: "*engine,*model,*model.make",
                order: sorting ? `${sorting.desc ? "-" : ""}${sorting.id}` : undefined,
                filters: filterValues,
            },
        }),
        queryKey: [["fitments", limit, offset, filterValues, sorting?.id, sorting?.desc]],
    })

    const table = useDataTable({
        columns,
        filters,
        data: data?.fitments || [],
        getRowId: (row) => row.id,
        rowCount: data?.metadata.count || 0,
        isLoading,
        pagination: {
            state: pagination,
            onPaginationChange: setPagination,
        },
        search: {
            state: search,
            onSearchChange: setSearch,
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
            navigate(`/fitments/${row.id}/products`)
    })

    return (
        <Container className="divide-y p-0">

            <DataTable instance={table}>
                <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
                    <Heading>Fitments</Heading>
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


export default FitmentList