import { getRelatedProducts } from "@/lib/data/products"
import { ProductGridItem } from "@/modules/products/components/product-item"
import { HttpTypes } from "@medusajs/types"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
}

export async function RelatedProducts({ product }: RelatedProductsProps) {
  const related = await getRelatedProducts(product, 4)

  if (related.length === 0) return null

  const category = product.categories?.[0]

  return (
    <section className="mt-16 border-t border-border/60 pt-12">
      {/* Section heading */}
      <div className="flex items-center justify-between mb-8">
        <p className="relative text-2xl font-extrabold uppercase tracking-widest text-foreground">
          <span className="relative">
            Related Products
            <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-primary" />
          </span>
        </p>
        {category?.handle && (
          <Link
            href={`/${category.handle}`}
            className="hidden md:inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {related.map((p) => (
          <ProductGridItem key={p.id} product={p} />
        ))}
      </div>

      {/* Mobile "View All" link */}
      {category?.handle && (
        <div className="mt-6 flex md:hidden">
          <Link
            href={`/${category.handle}`}
            className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            View All in {category.name}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </section>
  )
}
