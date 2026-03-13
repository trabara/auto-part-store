import { StoreProductCategory } from "@/lib/data/categories"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet"
import { getTranslations } from "next-intl/server"
import { CategoryNavMenu } from "./category-nav-menu"

type CategoryMenuSheetProps = {
  categories: StoreProductCategory[]
  children: React.ReactNode
}

export async function CategoryMenuSheet({
  categories,
  children,
}: CategoryMenuSheetProps) {
  const t = await getTranslations("categories")

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">
            {t("allCategories")}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <CategoryNavMenu key={category.id} category={category} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-sm">{t("settings")}</h3>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
