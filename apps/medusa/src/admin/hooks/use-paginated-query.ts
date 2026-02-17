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
export interface PaginatedQueryConfig<TData, T> {
  /** Query key prefix (e.g., "fitments", "makes") */
  queryKey: string;
  /** Fields to include in the query */
  fields?: string;
  /** Items per page (default: 15) */
  pageSize?: number;
  /** Query function that fetches data */
  queryFn: (params: PaginatedQueryParams) => Promise<TData>;
  /** Function to select and transform data */
  selectFn: (data: TData | undefined) => ({ data: T[] | undefined, rowCount: number | undefined });
  /** Additional query options */
  queryOptions?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;
}

/**
 * Parameters passed to the query function
 */
export interface PaginatedQueryParams {
  limit: number;
  offset: number;
  fields?: string;
  order?: string;
  filters?: Record<string, any>;
  search?: string;
}
/**
 * Return type of the usePaginatedQuery hook, which can be directly used as options for DataTable
 * Follows the structure of DataTableOptions, but with data and isLoading derived from the query
 * Includes pagination, filtering, and sorting state and handlers
 */
export type UsePaginatedQueryReturn<T extends { id: string }> =
  DataTableOptions<T> & {};

/**
 * Reusable hook for paginated, filtered, and sorted queries
 *
 * Follows SRP: Handles ONLY data fetching with pagination/filtering/sorting state
 * Follows OCP: Extensible via generic type parameters and config
 * Follows DIP: Depends on abstractions (config interface) not concretions
 *
 * @example
 * ```tsx
 * const { data, pagination, setPagination, sorting, setSorting } = usePaginatedQuery({
 *   queryKey: "fitments",
 *   endpoint: "/admin/fitments",
 *   fields: "*engine,*model,*model.make",
 *   queryFn: (params) => sdk.client.fetch(endpoint, { query: params })
 * });
 * ```
 */
export function usePaginatedQuery<
  TData extends { metadata: { count: number } },
  T extends { id: string },
>({
  queryKey,
  fields,
  pageSize = 15,
  queryFn,
  selectFn,
  queryOptions,
}: PaginatedQueryConfig<TData, T>): DataTableOptions<T> {
  const [search, setSearch] = useState<string>("");
  const [filtering, setFiltering] = useState<DataTableFilteringState>({});
  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize,
    pageIndex: 0,
  });
  const [selectedRows, setSelectedRows] = useState({});

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
  const queryParams: PaginatedQueryParams = {
    limit: pageSize,
    offset,
    fields,
    order: sorting ? `${sorting.desc ? "-" : ""}${sorting.id}` : undefined,
    filters: filterValues,
    search: search || undefined,
  };

  // Fetch data
  const { data, isLoading } = useQuery<TData>({
    queryFn: () => queryFn(queryParams),
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

  return {
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
  } as unknown as UsePaginatedQueryReturn<T>;
}
