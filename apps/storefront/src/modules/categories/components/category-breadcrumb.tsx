import { StoreProductCategory } from "@/lib/data/categories"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb"
import { useTranslations } from "next-intl"
import Link from "next/link"
import React from "react"

type BreadcrumbPath = {
  name: string
  handle: string
}

export function CategoryBreadcrumb({
  category,
  ...props
}: {
  category: StoreProductCategory
  className?: string
}) {
  const t = useTranslations('product')
  // Build ancestor chain: root → ... → current
  const chain: BreadcrumbPath[] = []
  let cur: StoreProductCategory | null | undefined = category
  while (cur) {
    chain.unshift({ name: cur.name, handle: cur.handle })
    cur = cur.parent_category ?? null
  }

  // Build cumulative hrefs from category handles only (no empty Home handle)
  const segments = chain.map((seg, i) => ({
    name: seg.name,
    href:
      "/" +
      chain
        .slice(0, i + 1)
        .map((s) => s.handle)
        .join("/"),
  }))

  return (
    <Breadcrumb {...props}>
      <BreadcrumbList>
        {/* Home */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="uppercase">
              {t("home") /* TODO: i18n */}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Category segments */}
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1
          return (
            <React.Fragment key={seg.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="uppercase">
                    {seg.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={seg.href} className="uppercase">
                      {seg.name}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
