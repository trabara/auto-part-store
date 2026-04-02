"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Grid, List, RefreshCcwIcon, Search, X } from "lucide-react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"

import { SORT_OPTIONS, SortOptions } from "@/lib/types"
import { useProductList } from "../hooks/use-product-list"
import { useProductFilters } from "../hooks/use-product-filters"
import { FilterDrawerButton } from "./filter-drawer-button"
import { createViewProductItem } from "./product-item"
import { useTranslations } from "next-intl"

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96]

type ProductListProps = { children?: React.ReactNode; className?: string }

export function ProductList({ children, className }: ProductListProps) {
  return <div className={cn(className)}>{children}</div>
}

export function ProductListFilterTags({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const t = useTranslations("product")
  const { activeOptions, queryParams } = useProductList((store) => ({
    activeOptions: store.activeOptions,
    queryParams: store.queryParams,
  }))
  const { removeOption, resetFilters, handleStatusChange } = useProductFilters()

  const hasOptionFilters = Object.keys(activeOptions).length > 0
  const hasPriceFilter =
    queryParams.min_price !== undefined || queryParams.max_price !== undefined
  const hasStatusFilter =
    queryParams.status !== undefined && queryParams.status.length > 0

  if (!hasOptionFilters && !hasPriceFilter && !hasStatusFilter) return null

  return (
    <div className={cn("items-center gap-2", className)} {...props}>
      <Badge
        variant="outline"
        className="p-2 items-center gap-1 cursor-pointer"
        onClick={resetFilters}
      >
        <X className="size-3 mr-1" />
        {t("list.clearAll")}
      </Badge>

      {hasPriceFilter && (
        <Badge
          variant="secondary"
          className="p-2 items-center gap-1"
        >
          Price:{" "}
          {queryParams.min_price !== undefined
            ? `${queryParams.min_price} – `
            : "up to "}
          {queryParams.max_price}
          <Button
            variant="ghost"
            size="icon"
            className="size-4 p-0 ml-1"
            onClick={() => resetFilters()}
          >
            <X className="size-3" />
          </Button>
        </Badge>
      )}

      {(queryParams.status ?? []).map((s) => (
        <Badge
          key={s}
          variant="secondary"
          className="p-2 items-center gap-1"
        >
          {s === "in_stock" ? t("list.inStock") : t("list.onSale")}
          <Button
            variant="ghost"
            size="icon"
            className="size-4 p-0 ml-1"
            onClick={() => handleStatusChange(s, false)}
          >
            <X className="size-3" />
          </Button>
        </Badge>
      ))}

      {Object.entries(activeOptions).map(([optionId, values]) =>
        values.map((value) => (
          <Badge
            key={`${optionId}-${value}`}
            variant="secondary"
            className="p-2 items-center gap-1"
          >
            {value}
            <Button
              variant="ghost"
              size="icon"
              className="size-4 p-0 ml-1"
              onClick={() => removeOption(optionId, value)}
            >
              <X className="size-3" />
            </Button>
          </Badge>
        ))
      )}
    </div>
  )
}

export function ProductListHeader({
  className,
}: HTMLAttributes<HTMLDivElement>) {
  const t = useTranslations("product")
  const { products, totalCount, display, setDisplay, sort, limit } =
    useProductList((store) => ({
      products: store.products,
      totalCount: store.totalCount,
      display: store.display,
      setDisplay: store.setDisplay,
      sort: store.sort,
      limit: store.limit,
    }))

  const { setSort, setLimit } = useProductFilters()

  const SORT_LABELS: Record<SortOptions, string> = {
    created_at: t("list.sortNewest"),
    name_asc: t("list.sortNameAsc"),
    name_desc: t("list.sortNameDesc"),
    price_asc: t("list.sortPriceAsc"),
    price_desc: t("list.sortPriceDesc"),
  }

  return (
    <div className={cn("mb-7.5 flex justify-between items-center", className)}>
      <div className="flex items-center gap-2">
        <FilterDrawerButton />
        <h6 className="hidden xl:block text-sm text-accent-foreground/50">
          {t("list.showing", { count: products.length, total: totalCount })}
        </h6>
      </div>
      <div className="flex gap-2">
        <Select value={sort} onValueChange={(v) => setSort(v as SortOptions)}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {SORT_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(limit)}
          onValueChange={(v) => setLimit(Number(v))}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Per page" />
          </SelectTrigger>
          <SelectContent>
            {ITEMS_PER_PAGE_OPTIONS.map((count) => (
              <SelectItem key={count} value={count.toString()}>
                {t("list.perPage", { count })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ButtonGroup className="hidden xl:flex">
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setDisplay("grid")}
            className={cn({ "bg-accent": display === "grid" })}
          >
            <Grid />
            <span className="sr-only">Grid View</span>
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setDisplay("list")}
            className={cn({ "bg-accent": display === "list" })}
          >
            <List />
            <span className="sr-only">List View</span>
          </Button>
        </ButtonGroup>
      </div>
    </div>
  )
}

export function ProductListContent() {
  const t = useTranslations("product")
  const { display, products, isLoading } = useProductList((store) => ({
    display: store.display,
    products: store.products,
    isLoading: store.isLoading,
  }))

  const { resetFilters } = useProductFilters()

  if (isLoading) {
    return <div>{t("list.loading")}</div>
  }

  if (products.length === 0) {
    return (
      <Empty className="bg-muted/30 h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>{t("list.noProducts")}</EmptyTitle>
          <EmptyDescription className="max-w-xs text-pretty">
            {t("list.noProductsDesc")}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={resetFilters}>
            <RefreshCcwIcon data-icon="inline-start" />
            {t("list.clearFilters")}
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const contentClassName = cn("grid", {
    "grid-cols-2 lg:grid-cols-3 gap-px bg-border": display === "grid",
    "grid-cols-1 divide-y divide-border": display === "list",
  })

  return (
    <div className={contentClassName}>
      {products.map((product) => {
        const Item = createViewProductItem(display)
        return <Item key={product.id} product={product} />
      })}
    </div>
  )
}

export function ProductListPagination({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { totalCount, currentPage, limit } = useProductList((store) => ({
    totalCount: store.totalCount,
    currentPage: store.currentPage,
    limit: store.limit,
  }))
  const { setPage } = useProductFilters()

  const totalPages = Math.ceil(totalCount / limit)

  if (totalPages <= 1) return null

  // Build page numbers to show: always first, last, and a window around current
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | "ellipsis")[] = [1]

    if (currentPage > 3) pages.push("ellipsis")

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (currentPage < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className={cn(className)} {...props}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1) setPage(currentPage - 1)
              }}
              aria-disabled={currentPage === 1}
              className={cn({
                "pointer-events-none opacity-50": currentPage === 1,
              })}
            />
          </PaginationItem>

          {pageNumbers.map((page, i) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === currentPage}
                  onClick={(e) => {
                    e.preventDefault()
                    setPage(page)
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages) setPage(currentPage + 1)
              }}
              aria-disabled={currentPage === totalPages}
              className={cn({
                "pointer-events-none opacity-50": currentPage === totalPages,
              })}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
