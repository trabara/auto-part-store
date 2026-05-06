import { sdk } from "@/lib/config"
import { getSession } from "@/lib/data/auth"
import { getAuthHeaders } from "@/lib/data/cookies"
import { getWishlist } from "@/lib/data/wishlist"
import { AccountTabs } from "@/modules/account/components/account-tabs"
import { LogoutButton } from "@/modules/account/components/logout-button"
import { User } from "lucide-react"
import { redirect } from "next/navigation"
import { Suspense } from "react"

type Props = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AccountPage({ searchParams }: Props) {
  const customer = await getSession()

  if (!customer) {
    redirect("/auth/login")
  }

  const { tab } = await searchParams
  const activeTab = tab ?? "profile"

  const headers = await getAuthHeaders()

  // Only fetch orders when that tab is active
  const orders =
    activeTab === "orders"
      ? await sdk.store.order
          .list(
            {
              limit: 20,
              fields:
                "+items,+items.variant,+items.variant.product,+subtotal,+total,+created_at",
            },
            headers as Record<string, string>
          )
          .then(({ orders: o }) => o)
          .catch(() => [])
      : []

  // Only fetch wishlist data when that tab is active
  let wishlistItems: Array<{
    id: string
    product_id: string
    product_variant_id: string
    quantity: number
  }> = []
  let productMap = new Map<
    string,
    {
      id: string
      title?: string | null
      handle?: string | null
      thumbnail?: string | null
      variants?: Array<{ id: string }>
    }
  >()

  if (activeTab === "wishlist") {
    const wishlist = await getWishlist()
    wishlistItems = wishlist?.items ?? []

    const productIds = [...new Set(wishlistItems.map((i) => i.product_id))]
    if (productIds.length > 0) {
      const products = await sdk.store.product
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

      productMap = new Map(products.map((p) => [p.id, p as any]))
    }
  }

  const displayName = customer.first_name
    ? `${customer.first_name} ${customer.last_name ?? ""}`.trim()
    : customer.email

  return (
    <div className="snap-container py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* Tabs */}
      <Suspense
        fallback={<div className="h-32 animate-pulse rounded-lg bg-muted" />}
      >
        <AccountTabs
          defaultTab={activeTab}
          customer={customer}
          orders={orders}
          wishlistItems={wishlistItems}
          productMap={productMap}
        />
      </Suspense>
    </div>
  )
}
