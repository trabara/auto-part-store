import { listProducts } from "@/lib/data/products"
import ProductListTemplate from "@/modules/products/templates"
import { parseSearchParams, SearchParams } from "@/modules/products/utils"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getTranslations } from "next-intl/server"
import { SearchIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const { q, sort, page, min_price, max_price, status, option_values, limit } =
    parseSearchParams(resolvedSearchParams)

  const t = await getTranslations("search")

  // No query — show empty prompt
  if (!q) {
    return (
      <div className="snap-container py-20">
        <Empty>
          <EmptyMedia variant="icon">
            <SearchIcon />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("emptyPromptTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyPromptDesc")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const { response, priceRange, options } = await listProducts({
    pageParam: page,
    queryParams: {
      q,
      limit,
      sort,
      ...(min_price !== undefined && { min_price }),
      ...(max_price !== undefined && { max_price }),
      ...(status !== undefined && { status }),
      ...(option_values.length > 0 && { option_values }),
    },
  })

  const totalCount = response.count

  if (totalCount === 0) {
    return (
      <div className="snap-container py-20">
        <h1 className="text-xl font-medium mb-8">{t("resultsFor", { q })}</h1>
        <Empty>
          <EmptyMedia variant="icon">
            <SearchIcon />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("noResults")}</EmptyTitle>
            <EmptyDescription>{t("noResultsDesc", { q })}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link href="/">{t("browseCatalog")}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="snap-container">
      <div className="pt-6 pb-2">
        <h1 className="text-xl font-medium">
          {t("resultsFor", { q })}
          <span className="text-muted-foreground text-sm font-normal ml-2">
            ({t("productsFound", { count: totalCount })})
          </span>
        </h1>
      </div>
      <ProductListTemplate
        products={response.products}
        totalCount={totalCount}
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
    </div>
  )
}
