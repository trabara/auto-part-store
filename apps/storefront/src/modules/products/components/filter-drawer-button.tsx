"use client"

import { Button } from "@repo/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer"
import { Funnel } from "lucide-react"
import CategoryFilters from "./category-filters"
import { useTranslations } from "next-intl"

export function FilterDrawerButton() {
  const t = useTranslations("filters")
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="xl:hidden">
          <Funnel className="size-4" />
          {t("title")}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
          <DrawerDescription>{t("description")}</DrawerDescription>
        </DrawerHeader>
        <CategoryFilters className="px-4 pb-20" />
      </DrawerContent>
    </Drawer>
  )
}
