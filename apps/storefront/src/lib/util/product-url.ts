import { SortOptions } from "@/lib/types"
import { ProductOptionValueFilter } from "@/lib/data/products"

export type ProductListUrlParams = {
  sort?: SortOptions
  page?: number
  min_price?: number
  max_price?: number
  status?: ("in_stock" | "on_sale")[]
  option_values?: ProductOptionValueFilter[]
  limit?: number
}

/**
 * Builds a URL search-param string from the given product list filters.
 * Preserves the current pathname — call with `window.location.pathname`.
 *
 * Option values are encoded as:
 *   options[<option_id>][]=<value>   (repeated for multiple values)
 *
 * The option_id in the URL is the option title string (e.g. "Color", "Size")
 * combined with the actual option_id separated by ":", so we can recover both
 * pieces when parsing:
 *   options[Color:opt_01JX…][]=Red
 */
export function buildProductListUrl(
  pathname: string,
  params: ProductListUrlParams
): string {
  const sp = new URLSearchParams()

  if (params.sort && params.sort !== "created_at") {
    sp.set("sort", params.sort)
  }
  if (params.page && params.page > 1) {
    sp.set("page", String(params.page))
  }
  if (params.min_price !== undefined) {
    sp.set("min_price", String(params.min_price))
  }
  if (params.max_price !== undefined) {
    sp.set("max_price", String(params.max_price))
  }
  if (params.status && params.status.length > 0) {
    for (const s of params.status) {
      sp.append("status", s)
    }
  }
  if (params.limit && params.limit !== 12) {
    sp.set("limit", String(params.limit))
  }

  // Encode option_values as options[<optionId>][]=<value>
  if (params.option_values && params.option_values.length > 0) {
    for (const { option_id, value } of params.option_values) {
      sp.append(`options[${option_id}]`, value)
    }
  }

  const qs = sp.toString()
  return qs ? `${pathname}?${qs}` : pathname
}
