import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  DataTableFilteringState,
  DataTablePaginationState,
  DataTableSortingState,
} from "@medusajs/ui";
import _ from "lodash";

/**
 * Configuration for paginated queries
 */
export interface PaginatedQueryConfig<TData> {
  /** Query key prefix (e.g., "fitments", "makes") */
  queryKey: string;
  /** Fields to include in the query */
  fields?: string;
  /** Items per page (default: 15) */
  pageSize?: number;
  /** Query function that fetches data */
  queryFn: (params: PaginatedQueryParams) => Promise<TData>;
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
 * Return type from usePaginatedQuery
 */
export interface UsePaginatedQueryReturn<TData> {
  // Data
  data: TData | undefined;
  isLoading: boolean;

  // Pagination
  pagination: DataTablePaginationState;
  setPagination: (state: DataTablePaginationState) => void;
  offset: number;

  // Search
  search: string;
  setSearch: (value: string) => void;

  // Filtering
  filtering: DataTableFilteringState;
  setFiltering: (state: DataTableFilteringState) => void;
  filterValues: Record<string, any>;

  // Sorting
  sorting: DataTableSortingState | null;
  setSorting: (state: DataTableSortingState | null) => void;
}

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
export function usePaginatedQuery<TData>({
  queryKey,
  fields,
  pageSize = 15,
  queryFn,
  queryOptions,
}: PaginatedQueryConfig<TData>): UsePaginatedQueryReturn<TData> {
  // Pagination state
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize,
    pageIndex: 0,
  });

  const offset = useMemo(() => {
    return pagination.pageIndex * pageSize;
  }, [pagination.pageIndex, pageSize]);

  // Search state
  const [search, setSearch] = useState<string>("");

  // Filtering state
  const [filtering, setFiltering] = useState<DataTableFilteringState>({});

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

  // Sorting state
  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);

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
      [
        queryKey,
        pageSize,
        offset,
        filterValues,
        sorting?.id,
        sorting?.desc,
        search,
      ],
    ],
    ...queryOptions,
  });

  return {
    data,
    isLoading,
    pagination,
    setPagination,
    offset,
    search,
    setSearch,
    filtering,
    setFiltering,
    filterValues,
    sorting,
    setSorting,
  };
}
