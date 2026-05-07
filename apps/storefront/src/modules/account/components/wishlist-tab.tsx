import { Button } from "@/components/ui/button"
import type { WishlistItem } from "@/lib/data/wishlist"
import { WishlistButton } from "@/modules/products/components/wishlist-button"
import { StoreProduct } from "@medusajs/types"
import { Heart, Tag } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"

type Props = {
  productMap: Map<string, StoreProduct>
}

export function WishlistTab({ productMap }: Props) {
  const t = useTranslations("wishlist")

  if (productMap.size === 0) {
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
      {Array.from(productMap.values()).map((product) => {
        if (!product) return null
        return (
          <div
            key={product.id}
            className="group relative flex flex-col bg-background border rounded-lg overflow-hidden"
          >
            <div className="absolute top-2 right-2 z-10">
              <WishlistButton
                productId={product.id}
                variantId={product.variants?.[0]?.id!}
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
