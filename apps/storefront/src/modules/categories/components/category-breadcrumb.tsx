import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@repo/ui/components/breadcrumb"
import { StoreProductCategory } from "@medusajs/types"
import React from "react"

export function CategoryBreadcrumb({ category, ...props }: { category: StoreProductCategory, className?: string }) {
    const paths: { name: string; handle: string }[] = [{
        name: category.name,
        handle: category.handle,
    }]

    let currentCategory = category
    while (currentCategory.parent_category) {
        currentCategory = currentCategory.parent_category
        paths.unshift({
            name: currentCategory.name,
            handle: currentCategory.handle,
        })
    }

    return (
        <Breadcrumb {...props}>
            <BreadcrumbList>
                {paths.map((path, index) => {
                    const href = `/${paths.slice(0, index + 1).map(p => p.handle).join("/")}`
                    return (
                        <React.Fragment key={path.handle}>
                            <BreadcrumbItem>
                                <BreadcrumbLink className="uppercase" href={href}>{path.name}</BreadcrumbLink>
                            </BreadcrumbItem>
                            {index < paths.length - 1 && <BreadcrumbSeparator />}
                        </React.Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}