import { getCategoryByHandle } from "@/lib/data/categories"
import { CategoryBreadcrumb } from "@/modules/categories/components/category-breadcrumb"
import { notFound } from "next/navigation"

export default async function Layout({ children, params }: { children: React.ReactNode, params: Promise<{ slug: string[] }> }) {
    const { slug } = await params

    const category = await getCategoryByHandle(slug)

    if (!category) {
        notFound()
    }

    return (
        <div className="snap-container">
            <CategoryBreadcrumb className="py-8" category={category} />
            <h1 className="text-6xl font-bold uppercase text-left!">
                {category.name}
            </h1>
            {children}
        </div>
    )
}