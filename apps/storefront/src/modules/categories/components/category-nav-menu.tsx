import { StoreProductCategory } from "@medusajs/types"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

type CategoryNavMenuProps = {
  category: StoreProductCategory
  paths?: string[]
}

export function CategoryNavMenu({ category, paths = [] }: CategoryNavMenuProps) {
  const hasSubcategories =
    category.category_children && category.category_children.length > 0


  const currentPaths = [...paths, category.handle]

  if (!hasSubcategories) {

    return (
      <Link
        href={`/${currentPaths.join("/")}`}
        className="flex items-center px-3 py-2 text-sm text-primary leading-none transition-colors hover:bg-accent hover:text-accent-foreground w-full"
      >
        {category.name}
      </Link>
    )
  }

  return (
    <details className="[&[open]>summary>svg]:rotate-90">
      <summary className="flex items-center justify-between px-3 py-2 text-sm text-primary leading-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer w-full list-none [&::-webkit-details-marker]:hidden">
        {category.name}
        <ChevronRight className="ml-2 size-4 transition-transform" />
      </summary>
      <div className="border-l border-border py-2 pl-4">
        {category.category_children!.map((subCategory) => (
          <CategoryNavMenu key={subCategory.handle} category={subCategory} paths={currentPaths} />
        ))}
      </div>
    </details>
  )
}
