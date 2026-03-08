import { getCategoryByHandle } from "@/lib/data/categories"
import { listProducts } from "@/lib/data/products"
import { CategoryBreadcrumb } from "@/modules/categories/components/category-breadcrumb"
import ProductListTemplate from "@/modules/products/templates"
import { parseSearchParams, SearchParams } from "@/modules/products/utils"
import Link from "next/link"
import { notFound } from "next/navigation"



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

  const { sort, page, min_price, max_price, status, option_values, limit } =
    parseSearchParams(resolvedSearchParams)

  const { response, priceRange, options } = await listProducts({
    pageParam: page,
    queryParams: {
      category_id: category.id,
      limit,
      sort,
      ...(min_price !== undefined && { min_price }),
      ...(max_price !== undefined && { max_price }),
      ...(status !== undefined && { status }),
      ...(option_values.length > 0 && { option_values }),
    },
  })

  console.log("response", response, priceRange, options)

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
        status={status}
        optionValues={option_values}
        priceRange={priceRange}
        availableOptions={options}
      />
    </>
  )
}
