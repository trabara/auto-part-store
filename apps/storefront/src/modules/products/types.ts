export type SortOptions = "price_asc" | "price_desc" | "created_at"

export type ProductFilterOption = {
  label: string
  value: string
  count: number
}

export type ProductFilter = {
  title: string
  options: ProductFilterOption[]
}

export type Display = "grid" | "list"
