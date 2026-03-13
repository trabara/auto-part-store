import { ProductOptionValueFilter } from "@/lib/data/products"
import { SORT_OPTIONS, SortOptions } from "@/lib/types"

export type SearchParams = {
  q?: string
  sort?: string
  page?: string
  min_price?: string
  max_price?: string
  status?: string | string[]
  // option filters: options[OptionTitle][]=optionValueId,...
  [key: string]: string | string[] | undefined
}

const DEFAULT_LIMIT = 12

export function parseSearchParams(searchParams: SearchParams): {
  q?: string
  sort: SortOptions
  page: number
  min_price?: number
  max_price?: number
  status?: ("in_stock" | "on_sale")[]
  option_values: ProductOptionValueFilter[]
  limit: number
} {
  const q =
    typeof searchParams.q === "string" && searchParams.q.trim().length > 0
      ? searchParams.q.trim()
      : undefined

  const sort = SORT_OPTIONS.includes(searchParams.sort as SortOptions)
    ? (searchParams.sort as SortOptions)
    : "created_at"

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1)

  const min_price = searchParams.min_price
    ? parseFloat(searchParams.min_price)
    : undefined
  const max_price = searchParams.max_price
    ? parseFloat(searchParams.max_price)
    : undefined

  // Parse option_values from:
  // option_values[0][option_id]=x&option_values[0][value]=y
  // OR: options[OptionTitle][]=optionValueId (human-readable URL style)
  // We support the human-readable style: options[Color][]=Red&options[Color][]=Blue
  // Each key is "options[<option_title>]" with value being a string or array.
  const option_values: ProductOptionValueFilter[] = []
  for (const [key, val] of Object.entries(searchParams)) {
    const match = key.match(/^options\[(.+)\]$/)
    if (!match) continue
    const option_id = match[1]! // we pass option_id as the title key from the URL
    const values = Array.isArray(val) ? val : val ? [val] : []
    for (const value of values) {
      option_values.push({ option_id, value })
    }
  }

  return {
    q,
    sort,
    page,
    min_price,
    max_price,
    status: (() => {
      const raw = searchParams.status
      const values = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter(
        (s): s is "in_stock" | "on_sale" => s === "in_stock" || s === "on_sale"
      )
      return values.length > 0 ? values : undefined
    })(),
    option_values,
    limit: DEFAULT_LIMIT,
  }
}
