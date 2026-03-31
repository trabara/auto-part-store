import { Entity } from "../types/data";
import { PageResponse, PageQueryParams, QueryFn, SelectFn } from "@/types/query";
import { } from '@medusajs/framework/http';
import {
  DataTableFilteringState,
  DataTableOptions,
  DataTablePaginationState,
  DataTableSortingState,
} from "@medusajs/ui";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import _ from "lodash";
import { useMemo, useState } from "react";
/**
 * Configuration for paginated queries
 */
export interface PageQueryConfig<T extends Entity, R extends PageResponse<T>> {
  /** Query key prefix (e.g., "fitments", "makes") */
  queryKey: string;
  /** Fields to include in the query */
  fields?: string;
  /** Items per page (default: 15) */
  pageSize?: number;
  /** Query function that fetches data */
  queryFn: QueryFn<R>;
  /** Function to select and transform data */
  selectFn: SelectFn<T, R>;
  /** Additional query options */
  queryOptions?: Omit<UseQueryOptions<R>, "queryKey" | "queryFn">;
  /** Default selected rows (by ID) */
  defaultRowsSelection?: Record<string, boolean>;
}


/**
 * Return type of the usePaginatedQuery hook, which can be directly used as options for DataTable
 * Follows the structure of DataTableOptions, but with data and isLoading derived from the query
 * Includes pagination, filtering, and sorting state and handlers
 */
export type UsePageQueryReturn<T extends { id: string }> = [
  DataTableOptions<T>,
  {
    setPagination: React.Dispatch<React.SetStateAction<DataTablePaginationState>>;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    setFiltering: React.Dispatch<React.SetStateAction<DataTableFilteringState>>;
    setSorting: React.Dispatch<React.SetStateAction<DataTableSortingState | null>>;
    setSelectedRows: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  }
];

/**
 * Reusable hook for paginated, filtered, and sorted queries
 *
 * Follows SRP: Handles ONLY data fetching with pagination/filtering/sorting state
 * Follows OCP: Extensible via generic type parameters and config
 * Follows DIP: Depends on abstractions (config interface) not concretions
 *
 * @example
 * ```tsx
 * const { data, pagination, setPagination, sorting, setSorting } = usePageQuery({
 *   queryKey: "fitments",
 *   endpoint: "/admin/fitments",
 *   fields: "*engine,*model,*model.make",
 *   queryFn: (params) => sdk.client.fetch(endpoint, { query: params })
 * });
 * ```
 */
export function usePageQuery<
  T extends { id: string },
  R extends PageResponse<T>,
>({
  queryKey,
  fields,
  pageSize = 15,
  queryFn,
  selectFn,
  queryOptions,
  defaultRowsSelection = {},
}: PageQueryConfig<T, R>): UsePageQueryReturn<T> {
  const [search, setSearch] = useState<string>("");
  const [filtering, setFiltering] = useState<DataTableFilteringState>({});
  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize,
    pageIndex: 0,
  });
  const [selectedRows, setSelectedRows] = useState(() => defaultRowsSelection);

  const offset = useMemo(() => {
    return pagination.pageIndex * pageSize;
  }, [pagination.pageIndex, pageSize]);

  const filterValues = useMemo(() => {
    const result: Record<string, any> = {};
    Object.keys(filtering).forEach((key) => {
      const value = filtering[key];
      if (value) {
        _.set(result, key, value);
      }
    });
    return result;
  }, [filtering]);

  // Build query parameters
  const queryParams: PageQueryParams = {
    limit: pageSize,
    offset,
    fields,
    order: sorting ? `${sorting.desc ? "-" : ""}${sorting.id}` : undefined,
    filters: filterValues,
    search: search || undefined,
  };

  // Fetch data
  const { data, isLoading } = useQuery<R>({
    queryFn: ({ signal }) => queryFn(signal, queryParams),
    queryKey: [
      queryKey,
      pageSize,
      offset,
      filterValues,
      sorting?.id,
      sorting?.desc,
      search,
    ],
    ...queryOptions,
  });

  const dataWithMeta = data ? selectFn(data) : { data: [], rowCount: 0 };

  return [
    {
      ...dataWithMeta,
      isLoading,
      getRowId: (row: T) => row.id,
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
        state: sorting,
        onSortingChange: setSorting,
      },
      rowSelection: {
        state: selectedRows,
        onRowSelectionChange: setSelectedRows,
      },
    } as unknown as DataTableOptions<T>,
    {
      setPagination,
      setSearch,
      setFiltering,
      setSorting,
      setSelectedRows,
    }
  ];
}
