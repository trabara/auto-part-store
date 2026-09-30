/**
 * Parameters passed to the query function
 */
export interface PageQueryParams {
  limit: number
  offset: number
  fields?: string
  order?: string
  q?: string
  filters?: Record<string, any>
  search?: string
}

/**
 * Type definition for the query function used in paginated queries
 */
export type QueryFn<R> = (signal: AbortSignal, params: PageQueryParams) => Promise<R>

/**
 * Type definition for the select function used to transform query data
 */
export type SelectFn<T, R> = (data: R | undefined) => {
  data: T[] | undefined
  rowCount: number | undefined
}
