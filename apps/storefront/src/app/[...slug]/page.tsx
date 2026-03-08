import { getCategoryByHandle } from "@/lib/data/categories"
import { listProducts, ProductOptionValueFilter } from "@/lib/data/products"
import { SORT_OPTIONS, SortOptions } from "@/lib/types"
import { CategoryBreadcrumb } from "@/modules/categories/components/category-breadcrumb"
import ProductListTemplate from "@/modules/products/templates"
import Link from "next/link"
import { notFound } from "next/navigation"

const DEFAULT_LIMIT = 12

type SearchParams = {
  sort?: string
  page?: string
  min_price?: string
  max_price?: string
  // option filters: options[OptionTitle][]=optionValueId,...
  [key: string]: string | string[] | undefined
}

function parseSearchParams(searchParams: SearchParams): {
  sort: SortOptions
  page: number
  min_price?: number
  max_price?: number
  option_values: ProductOptionValueFilter[]
  limit: number
} {
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
    sort,
    page,
    min_price,
    max_price,
    option_values,
    limit: DEFAULT_LIMIT,
  }
}

export default async function CategoryProducts({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<SearchParams>
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ])

  const category = await getCategoryByHandle(slug)

  if (!category) {
    notFound()
  }

  if (category.category_children.length > 0) {
    return (
      <>
        <CategoryBreadcrumb className="py-4" category={category} />
        <div className="mt-8">
          <h1 className="text-2xl font-medium mb-4 text-left! after:content-[''] after:block after:w-16 after:h-1 after:bg-primary">
            SHOP BY CATEGORIES
          </h1>
          <div className="grid gap-4 md:grid-cols-2">
            {category.category_children.map((child) => (
              <Link
                key={child.id}
                href={`/${category.handle}/${child.handle}`}
                className="block py-2 px-4 border border-accent-foreground/20"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      </>
    )
  }

  const { sort, page, min_price, max_price, option_values, limit } =
    parseSearchParams(resolvedSearchParams)

  const { response, priceRange, options } = await listProducts({
    pageParam: page,
    queryParams: {
      category_id: category.id,
      limit,
      sort,
      ...(min_price !== undefined && { min_price }),
      ...(max_price !== undefined && { max_price }),
      ...(option_values.length > 0 && { option_values }),
    },
  })

  return (
    <>
      <CategoryBreadcrumb className="py-4" category={category} />
      <h1 className="text-2xl font-bold uppercase text-left!">
        {category.name}
      </h1>
      <ProductListTemplate
        products={response.products}
        totalCount={response.count}
        currentPage={page}
        limit={limit}
        sort={sort}
        minPrice={min_price}
        maxPrice={max_price}
        optionValues={option_values}
        priceRange={priceRange}
        availableOptions={options}
      />
    </>
  )
}
