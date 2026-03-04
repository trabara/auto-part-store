import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Funnel } from "lucide-react"
import CategoryFilters from "./category-filters"

export function FilterDrawerButton() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="xl:hidden">
          <Funnel className="size-4" />
          Filters
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Refine your product search</DrawerDescription>
        </DrawerHeader>
        <CategoryFilters className="px-4 pb-20" />
      </DrawerContent>
    </Drawer>
  )
}
