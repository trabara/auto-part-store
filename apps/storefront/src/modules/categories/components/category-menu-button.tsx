import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { CategoryNavMenu } from "./category-nav-menu"
import { StoreProductCategory } from "@medusajs/types"
import { cn } from "@/lib/utils"

type CategoryMenuButtonProps = {
  categories: StoreProductCategory[]
  side: "left" | "right"
  className?: string
}

export function CategoryMenuButton({
  categories = [],
  side = "left",
  className,
}: CategoryMenuButtonProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className={cn("inline-flex items-center", className)}>
          <Menu />
          <span className="hidden xl:block ml-2">ALL CATEGORIES</span>
        </Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">ALL CATEGORIES</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <CategoryNavMenu key={category.id} category={category} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-sm">SETTINGS</h3>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
