export interface PageResponseMeta {
  count: number;
  take: number;
  skip: number;
}

export interface PageResponse<T> {
  data: T[];
  metadata: PageResponseMeta
}

/**
 * Parameters passed to the query function
 */
export interface PageQueryParams {
  limit: number;
  offset: number;
  fields?: string;
  order?: string;
  filters?: Record<string, any>;
  search?: string;
}

/**
 * Type definition for the query function used in paginated queries
 */
export type QueryFn<T, Response extends PageResponse<T>> = (signal: AbortSignal, params: PageQueryParams) => Promise<Response>

/**
 * Type definition for the select function used to transform query data
 */
export type SelectFn<T, Response extends PageResponse<T>> = (data: Response | undefined) => ({ data: T[] | undefined, rowCount: number | undefined })