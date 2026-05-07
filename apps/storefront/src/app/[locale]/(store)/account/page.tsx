import { getSession } from "@/lib/data/auth"
import { getOrders } from "@/lib/data/order"
import { getWishlistProductItems } from "@/lib/data/wishlist"
import AccountTemplate from "@/modules/account/templates/account"
import { StoreProduct } from "@medusajs/types"
import { redirect } from "next/navigation"

type AccountPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AccountPage({ searchParams }: AccountPageProps) {

  const { tab } = await searchParams
  const activeTab = tab ?? "profile"

  const customer = await getSession()

  if (!customer) {
    redirect("/auth/login")
  }

  const orders = activeTab === "orders"
    ? await getOrders().catch(() => [])
    : []

  const wishlistProductMap = activeTab === "wishlist"
    ? await getWishlistProductItems()
    : new Map<string, StoreProduct>()


  return <AccountTemplate
    activeTab={activeTab}
    customer={customer}
    orders={orders}
    wishlistProductMap={wishlistProductMap}
  />
}
