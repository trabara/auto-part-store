import { getCategoryByHandle } from "@/lib/data/categories"
import { listProductsWithSort } from "@/lib/data/products"
import { CategoryBreadcrumb } from "@/modules/categories/components/category-breadcrumb"
import ProductListTemplate from "@/modules/products/templates"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CategoryProducts({
    params,
}: {
    params: Promise<{ slug: string[] }>,
}) {

    const { slug } = await params
    const category = await getCategoryByHandle(slug)

    if (!category) {
        notFound()
    }

    if (category.category_children.length > 0) {
        return (
            <>
                <CategoryBreadcrumb className="py-4" category={category} />
                <div className="mt-8">
                    <h1 className="text-2xl font-medium mb-4 text-left! after:content-[''] after:block after:w-16 after:h-1 after:bg-primary">SHOP BY CATEGORIES</h1>
                    <div className="grid gap-4 md:grid-cols-2">
                        {category.category_children.map((child) => (
                            <Link
                                key={child.id}
                                href={`/${category.handle}/${child.handle}`}
                                className="block py-2 px-4 border border-accent-foreground/20"
                            >
                                {child.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </>
        )
    }
    // const fitment = await retreiveFitment()
    const { response } = await listProductsWithSort({
        queryParams: {
            category_id: category.id,
        },
    })

    return (
        <>
            <CategoryBreadcrumb className="py-4" category={category} />
            <h1 className="text-2xl font-bold uppercase text-left!">{category.name}</h1>
            <ProductListTemplate products={response.products} />
        </>
    )
}
