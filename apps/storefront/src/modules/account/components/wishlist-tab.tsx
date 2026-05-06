import type { WishlistItem } from "@/lib/data/wishlist"
import { WishlistButton } from "@/modules/products/components/wishlist-button"
import { Button } from "@/components/ui/button"
import { Heart, Tag } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"

type SimpleProduct = {
  id: string
  title?: string | null
  handle?: string | null
  thumbnail?: string | null
  variants?: Array<{ id: string }>
}

type Props = {
  items: WishlistItem[]
  productMap: Map<string, SimpleProduct>
}

export function WishlistTab({ items, productMap }: Props) {
  const t = useTranslations("wishlist")

  if (items.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center text-muted-foreground">
        <Heart className="size-12 stroke-1" />
        <p className="text-sm">{t("empty")}</p>
        <Button asChild variant="outline">
          <Link href="/">{t("continueShopping")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-2">
      {items.map((item) => {
        const product = productMap.get(item.product_id)
        if (!product) return null
        return (
          <div
            key={item.id}
            className="group relative flex flex-col bg-background border rounded-lg overflow-hidden"
          >
            <div className="absolute top-2 right-2 z-10">
              <WishlistButton
                productId={item.product_id}
                variantId={item.product_variant_id}
                className="size-7 bg-background/90 backdrop-blur-sm shadow-sm border border-border/50 hover:bg-background"
              />
            </div>

            <Link
              href={`/p/${product.handle}`}
              className="relative aspect-square bg-accent/40 block"
            >
              {product.thumbnail ? (
                <Image
                  unoptimized
                  src={product.thumbnail}
                  alt={product.title ?? ""}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                  <Tag className="size-8" strokeWidth={1} />
                </div>
              )}
            </Link>

            <div className="p-3">
              <Link
                href={`/p/${product.handle}`}
                className="hover:text-primary transition-colors"
              >
                <p className="text-sm font-medium line-clamp-2">
                  {product.title}
                </p>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
