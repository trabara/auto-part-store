import {
  getCategoryByHandle,
  StoreProductCategory,
} from "@/lib/data/categories"
import { retreiveFitment } from "@/lib/data/fitments"
import { listProducts } from "@/lib/data/products"
import ProductCategoryCard from "@/modules/categories/components/category-card"
import { FitmentCTA } from "@/modules/fitment/components/fitment-cta"
import ProductListTemplate from "@/modules/products/templates"
import { parseSearchParams, SearchParams } from "@/modules/products/utils"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

export default async function CategoryProducts({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[]; locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const [{ slug, locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ])

  const [category, fitment, t] = await Promise.all([
    getCategoryByHandle(slug),
    retreiveFitment(),
    getTranslations({ locale, namespace: "categories" }),
  ])

  if (!category) {
    notFound()
  }

  if (category.category_children.length > 0) {
    return (
      <div className="space-y-8 mt-8">
        <section className="bg-primary text-primary-foreground py-14">
          <div className="snap-container">
            <FitmentCTA fitment={fitment} />
          </div>
        </section>

        <h1 className="text-2xl font-medium mb-4  after:content-[''] after:block after:w-16 after:h-1 after:bg-primary">
          {t("mostPopularParts")}
        </h1>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {category.category_children.map((child: StoreProductCategory) => {
            return <ProductCategoryCard key={child.id} category={child} />
          })}
        </div>
      </div>
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

  return (
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
  )
}
