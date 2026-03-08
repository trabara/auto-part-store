"use client"

import { Button } from "@repo/ui/components/button"
import { ButtonGroup } from "@repo/ui/components/button-group"
import { Grid, List, RefreshCcwIcon, Search, X } from "lucide-react"
import { Badge } from "@repo/ui/components/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { cn } from "@repo/ui/lib/utils"
import { HTMLAttributes } from "react"

import { SORT_OPTIONS, SortOptions } from "@/lib/types"
import { useProductList } from "../hooks/use-product-list"
import { useProductFilters } from "../hooks/use-product-filters"
import { FilterDrawerButton } from "./filter-drawer-button"
import { createViewProductItem } from "./product-item"

const SORT_LABELS: Record<SortOptions, string> = {
  created_at: "Newest First",
  name_asc: "Name A–Z",
  name_desc: "Name Z–A",
  price_asc: "Price Low–High",
  price_desc: "Price High–Low",
}

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96]

type ProductListProps = { children?: React.ReactNode; className?: string }

export function ProductList({ children, className }: ProductListProps) {
  return <div className={cn(className)}>{children}</div>
}

export function ProductListFilterTags({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { activeOptions, queryParams } = useProductList((store) => ({
    activeOptions: store.activeOptions,
    queryParams: store.queryParams,
  }))
  const { removeOption, resetFilters } = useProductFilters()

  const hasOptionFilters = Object.keys(activeOptions).length > 0
  const hasPriceFilter =
    queryParams.min_price !== undefined || queryParams.max_price !== undefined

  if (!hasOptionFilters && !hasPriceFilter) return null

  return (
    <div className={cn("items-center gap-2", className)} {...props}>
      <Badge
        variant="outline"
        className="p-2 items-center cursor-pointer"
        onClick={resetFilters}
      >
        <X className="size-3 mr-1" />
        Clear all
      </Badge>

      {hasPriceFilter && (
        <Badge variant="secondary" className="p-2 items-center gap-1">
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

  return (
    <div className={cn("mb-7.5 flex justify-between items-center", className)}>
      <div className="flex items-center gap-2">
        <FilterDrawerButton />
        <h6 className="hidden xl:block text-sm text-accent-foreground/50">
          Showing {products.length} of {totalCount} results
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
                {count} / page
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
  const { display, products, isLoading } = useProductList((store) => ({
    display: store.display,
    products: store.products,
    isLoading: store.isLoading,
  }))

  const { resetFilters } = useProductFilters()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (products.length === 0) {
    return (
      <Empty className="bg-muted/30 h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>No Products Found</EmptyTitle>
          <EmptyDescription className="max-w-xs text-pretty">
            We couldn&apos;t find any products matching your filters. Try
            adjusting or clearing your filters.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={resetFilters}>
            <RefreshCcwIcon data-icon="inline-start" />
            Clear filters
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const contentClassName = cn(
    "grid divide-accent-foreground/10 border border-accent-foreground/10",
    {
      "grid-cols-2 lg:grid-cols-3 divide-y divide-x": display === "grid",
      "grid-cols-1 divide-y": display === "list",
    }
  )

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
