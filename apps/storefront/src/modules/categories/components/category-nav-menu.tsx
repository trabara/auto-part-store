import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useCallback, useRef, useState } from "react"
import { ProductCategoryItem } from "../data/productCategories"

function MenuItem({
  active,
  leaf,
  children,
}: {
  active: boolean
  leaf?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm leading-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer w-full">
      {children}
      {!leaf && (
        <ChevronRight
          className={cn("ml-2 size-4 transition-transform", {
            "rotate-90": active,
          })}
        />
      )}
    </div>
  )
}

export function CategoryNavMenu({
  category,
  onDepthChange,
  currentDepth,
}: {
  category: ProductCategoryItem
  onDepthChange?: (depth: number) => void
  currentDepth?: number
}) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setHoveredCategory(category.id)
    if (onDepthChange && currentDepth) {
      onDepthChange(currentDepth)
    }
  }, [category.id, onDepthChange, currentDepth])
  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setHoveredCategory(null)
      if (onDepthChange && currentDepth) {
        onDepthChange(currentDepth - 1)
      }
    }, 150)
  }, [onDepthChange, currentDepth])

  const hasSubcategories =
    category.category_children && category.category_children.length > 0

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {hasSubcategories ? (
        <MenuItem active={hoveredCategory === category.id}>
          {category.name}
        </MenuItem>
      ) : (
        <Link
          href={category.handle}
          className="block rounded-md px-3 py-2 text-sm leading-none transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <MenuItem active={hoveredCategory === category.id} leaf>
            {category.name}
          </MenuItem>
        </Link>
      )}

      {hasSubcategories && hoveredCategory === category.id && (
        <div
          className={cn("bg-popover border-l border-border h-full py-2 pl-4")}
        >
          {category.category_children!.map((subCategory) => (
            <CategoryNavMenu key={subCategory.handle} category={subCategory} />
          ))}
        </div>
      )}
    </div>
  )
}
