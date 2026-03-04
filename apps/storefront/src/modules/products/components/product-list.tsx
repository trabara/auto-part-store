"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"

import { Grid, List, RefreshCcwIcon, Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/util/cn"
import { HTMLAttributes } from "react"

import { useProductList } from "../hooks/use-product-list"
import { FilterDrawerButton } from "./filter-drawer-button"
import { createViewProductItem } from "./product-item"

const SORT_OPTIONS = [
  "featured",
  "best-selling",
  "alphabetically-a-z",
  "alphabetically-z-a",
  "price-low-high",
  "price-high-low",
  "date-new-old",
  "date-old-new",
]

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96]

type ProductListProps = { children?: React.ReactNode; className?: string }

export function ProductList({ children, className }: ProductListProps) {
  return <div className={cn(className)}>{children}</div>
}

export function ProductListFilterTags({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { options, resetOptions, removeOptions } = useProductList((store) => ({
    options: store.options,
    resetOptions: store.resetOptions,
    removeOptions: store.removeOptions,
  }))

  const hasFilters = Object.keys(options).length > 0
  if (!hasFilters) return null

  return (
    <div className={cn("items-center gap-2", className)} {...props}>
      <Badge variant="outline" className="p-2 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="size-4 p-0 mr-1"
          onClick={() => resetOptions()}
        >
          <X className="size-4" />
        </Button>
        Clear filter
      </Badge>
      {Object.entries(options).map(([key, optionValues]) =>
        optionValues.map((ov) => (
          <Badge key={ov.id} variant="outline" className="p-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              className="size-4 p-0 mr-1"
              onClick={() => removeOptions(key, [ov])}
            >
              <X className="size-4" />
            </Button>
            {ov.value}
          </Badge>
        ))
      )}
    </div>
  )
}

export function ProductListHeader({
  className,
}: HTMLAttributes<HTMLDivElement>) {
  const { products, display, setDisplay } = useProductList((store) => ({
    products: store.products,
    display: store.display,
    setDisplay: store.setDisplay,
  }))

  return (
    <div className={cn("mb-7.5 flex justify-between items-center", className)}>
      <div className="flex items-center gap-2">
        <FilterDrawerButton />
        <h6 className="hidden xl:block text-sm text-accent-foreground/50">
          Showing {products.length} results
        </h6>
      </div>
      <div className="flex gap-2">
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (char) => char.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Items per page" />
          </SelectTrigger>
          <SelectContent>
            {ITEMS_PER_PAGE_OPTIONS.map((count) => (
              <SelectItem key={count} value={count.toString()}>
                {count} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ButtonGroup className="hidden xl:block">
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
            We couldn&apos;t find any products matching your search. Try
            adjusting your filters or search terms.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline">
            <RefreshCcwIcon data-icon="inline-start" />
            Refresh
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
