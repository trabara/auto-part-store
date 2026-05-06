import { getWishlist } from "@/lib/data/wishlist"
import { getSession } from "@/lib/data/auth"
import { sdk } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import { WishlistButton } from "@/modules/products/components/wishlist-button"
import { Button } from "@/components/ui/button"
import { Heart, Tag } from "lucide-react"
import { getTranslations } from "next-intl/server"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function WishlistPage() {
  const customer = await getSession()

  if (!customer) {
    redirect("/auth/login")
  }

  const t = await getTranslations("wishlist")

  const wishlist = await getWishlist()
  const items = wishlist?.items ?? []

  // Fetch product details for each wishlisted item
  const headers = await getAuthHeaders()
  const productIds = [...new Set(items.map((i) => i.product_id))]
  const products =
    productIds.length > 0
      ? await sdk.store.product
          .list(
            {
              id: productIds,
              limit: productIds.length,
              fields: "id,title,handle,thumbnail,variants.id",
            },
            headers as Record<string, string>
          )
          .then(({ products: p }) => p)
          .catch(() => [])
      : []

  const productMap = new Map(products.map((p) => [p.id, p]))

  return (
    <div className="snap-container py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="size-6 text-primary" />
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <span className="text-sm text-muted-foreground">
          ({items.length} {t("items")})
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 text-center text-muted-foreground">
          <Heart className="size-12 stroke-1" />
          <p className="text-sm">{t("empty")}</p>
          <Button asChild variant="outline">
            <Link href="/">{t("continueShopping")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => {
            const product = productMap.get(item.product_id)
            if (!product) return null
            return (
              <div
                key={item.id}
                className="group relative flex flex-col bg-background border rounded-lg overflow-hidden"
              >
                {/* Remove from wishlist */}
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
      )}
    </div>
  )
}
