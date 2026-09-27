import {
  DataTableFilteringState,
  DataTableOptions,
  DataTablePaginationState,
  DataTableSortingState,
} from "@medusajs/ui";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { isUndefined, keys, omitBy } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QueryFn, SelectFn } from "../lib/types";

/**
 * Turns the hook's search/sort/page/filter state into a URLSearchParams
 * instance. Filters are written as bracket-style params, e.g.
 * `[status]=active`, so they don't collide with `q`/`order`/`offset`.
 *
 * Built with the native URLSearchParams API rather than a query-string
 * library so its `.toString()` output matches what `useSearchParams()`
 * hands back after the URL is set — that byte-for-byte match is what lets
 * the two sync effects below tell "we wrote this" apart from "the browser
 * navigated" (see lastSyncedSearch below).
 */
function buildSearchParams(
  search: string,
  sorting: DataTableSortingState | null,
  offset: number,
  filters: Record<string, string>,
): URLSearchParams {
  const params = new URLSearchParams();

  if (search) {
    params.set("q", search);
  }
  if (sorting) {
    params.set("order", `${sorting.desc ? "-" : ""}${sorting.id}`);
  }
  if (offset) {
    params.set("offset", String(offset));
  }
  keys(filters).forEach((key) => {
    params.set(`[${key}]`, filters[key]!);
  });

  return params;
}

/**
 * The inverse of buildSearchParams: reads search/sort/page/filter state
 * back out of a URLSearchParams instance.
 */
function parseStateFromParams(
  params: URLSearchParams,
  pageSize: number,
): {
  search: string;
  sorting: DataTableSortingState | null;
  pagination: DataTablePaginationState;
  filtering: DataTableFilteringState;
} {
  const q = params.get("q") || "";
  const order = params.get("order") || undefined;
  const offsetParam = params.get("offset");

  const sorting: DataTableSortingState | null = order
    ? { id: order.replace(/^-/, ""), desc: order.startsWith("-") }
    : null;

  const pagination: DataTablePaginationState = {
    pageSize,
    pageIndex: offsetParam ? Math.floor(Number(offsetParam) / pageSize) : 0,
  };

  const filtering: DataTableFilteringState = {};
  params.forEach((value, key) => {
    const match = key.match(/^\[(.+)\]$/);
    if (match) {
      (filtering as Record<string, string>)[match[1]] = value;
    }
  });

  return { search: q, sorting, pagination, filtering };
}

/**
 * Configuration for paginated queries
 */
export interface PageQueryConfig<T extends { id: string }, R> {
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
    setPagination: React.Dispatch<
      React.SetStateAction<DataTablePaginationState>
    >;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    setFiltering: React.Dispatch<React.SetStateAction<DataTableFilteringState>>;
    setSorting: React.Dispatch<
      React.SetStateAction<DataTableSortingState | null>
    >;
    setSelectedRows: React.Dispatch<
      React.SetStateAction<Record<string, boolean>>
    >;
  } & {
    isError: boolean;
    error: Error | null;
  },
];

/**
 * Reusable hook for paginated, filtered, and sorted queries
 *
 * Follows SRP: Handles ONLY data fetching with pagination/filtering/sorting state
 * Follows OCP: Extensible via generic type parameters and config
 * Follows DIP: Depends on abstractions (config interface) not concretions
 *
 * URL sync is bidirectional:
 * - State -> URL: search/sort/page/filter changes are written to the URL
 *   with `replace: true`, so normal interaction doesn't spam history.
 * - URL -> state: when the URL changes for a reason other than our own
 *   write-back (browser back/forward, a link, a manual edit), state is
 *   re-derived from the URL so the table reflects what the address bar
 *   actually says — including which page you were on.
 * A ref tracks the last query string this hook itself wrote, which is how
 * the two effects avoid re-triggering each other / looping.
 *
 * @example
 * ```tsx
 * const { data, pagination, setPagination, sorting, setSorting } = usePageQuery({
 *   queryKey: "fitments",
 *   endpoint: "/admin/automotive/vehicles",
 *   fields: "*engine,*model,*model.make",
 *   queryFn: (params) => sdk.client.fetch(endpoint, { query: params })
 * });
 * ```
 */
export function usePageQuery<T extends { id: string }, R>({
  queryKey,
  fields,
  pageSize = 15,
  queryFn,
  selectFn,
  queryOptions,
  defaultRowsSelection = {},
}: PageQueryConfig<T, R>): UsePageQueryReturn<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  // Seed state from the URL once, on mount.
  const initial = useMemo(
    () => parseStateFromParams(searchParams, pageSize),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [search, setSearch] = useState<string>(initial.search);
  const [filtering, setFiltering] = useState<DataTableFilteringState>(
    initial.filtering,
  );
  const [sorting, setSorting] = useState<DataTableSortingState | null>(
    initial.sorting,
  );
  const [pagination, setPagination] = useState<DataTablePaginationState>(
    initial.pagination,
  );
  const [selectedRows, setSelectedRows] = useState(() => defaultRowsSelection);

  const offset = useMemo(() => {
    return pagination.pageIndex * pageSize;
  }, [pagination.pageIndex, pageSize]);

  const filters = useMemo(() => {
    return omitBy(filtering, isUndefined) as Record<string, string>;
  }, [filtering]);

  // Tracks the query string this hook itself last wrote (or, at mount, the
  // URL it started from), so the two effects below can tell their own
  // writes apart from external navigation and never chase each other.
  const lastSyncedSearch = useRef(searchParams.toString());

  // State -> URL: push local changes out, without adding history entries.
  useEffect(() => {
    const nextParams = buildSearchParams(search, sorting, offset, filters);
    const nextQueryString = nextParams.toString();

    if (nextQueryString === lastSyncedSearch.current) {
      return;
    }

    lastSyncedSearch.current = nextQueryString;
    setSearchParams(nextParams, { replace: true });
  }, [search, sorting, offset, filters, setSearchParams]);

  // URL -> state: browser back/forward (or any other outside change to the
  // URL) is detected by comparing the live URL to what we last wrote
  // ourselves, and re-hydrates state to match — including the page index,
  // so going back actually returns you to the page you were on.
  useEffect(() => {
    const currentQueryString = searchParams.toString();

    if (currentQueryString === lastSyncedSearch.current) {
      return;
    }

    lastSyncedSearch.current = currentQueryString;
    const next = parseStateFromParams(searchParams, pageSize);
    setSearch(next.search);
    setSorting(next.sorting);
    setPagination(next.pagination);
    setFiltering(next.filtering);
  }, [searchParams, pageSize]);

  // Fetch data
  const { data, isLoading, isError, error } = useQuery<R>({
    queryFn: ({ signal }) => {
      const query = {
        limit: pageSize,
        offset,
        q: search,
        order: sorting ? `${sorting.desc ? "-" : ""}${sorting.id}` : undefined,
        fields,
        filters,
      };
      return queryFn(signal, query);
    },
    queryKey: [
      queryKey,
      pageSize,
      offset,
      filters,
      sorting?.id,
      sorting?.desc,
      search,
    ],
    ...queryOptions,
  });

  const dataWithMeta = data ? selectFn(data) : { data: [], rowCount: 0 };

  // Wrapping search/sort/filter setters so a *user-driven* change resets
  // pagination back to page 1. useCallback keeps them referentially stable
  // (matching how the raw setState dispatchers behaved before). The
  // URL -> state effect above calls the raw setters directly, so restoring
  // a deep link or navigating back/forward is never second-guessed by an
  // automatic page reset.
  const handleSearchChange = useCallback(
    (value: React.SetStateAction<string>) => {
      setSearch(value);
      setPagination((prev) =>
        prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
      );
    },
    [],
  );

  const handleSortingChange = useCallback(
    (value: React.SetStateAction<DataTableSortingState | null>) => {
      setSorting(value);
      setPagination((prev) =>
        prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
      );
    },
    [],
  );

  const handleFilteringChange = useCallback(
    (value: React.SetStateAction<DataTableFilteringState>) => {
      setFiltering(value);
      setPagination((prev) =>
        prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
      );
    },
    [],
  );

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
        debounce: 1000,
        state: search,
        onSearchChange: handleSearchChange,
      },
      filtering: {
        state: filtering,
        onFilteringChange: handleFilteringChange,
      },
      sorting: {
        state: sorting,
        onSortingChange: handleSortingChange,
      },
      rowSelection: {
        state: selectedRows,
        onRowSelectionChange: setSelectedRows,
      },
    } as unknown as DataTableOptions<T>,
    {
      setPagination,
      setSearch: handleSearchChange,
      setFiltering: handleFilteringChange,
      setSorting: handleSortingChange,
      setSelectedRows,
      isError,
      error,
    },
  ];
}
