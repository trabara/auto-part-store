"use client"

import { ProfileForm } from "@/modules/account/components/profile-form"
import { OrdersTab } from "@/modules/account/components/orders-tab"
import { WishlistTab } from "@/modules/account/components/wishlist-tab"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { WishlistItem } from "@/lib/data/wishlist"
import type { StoreCustomer, StoreOrder } from "@medusajs/types"
import { Heart, Package, User } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"

type SimpleProduct = {
  id: string
  title?: string | null
  handle?: string | null
  thumbnail?: string | null
  variants?: Array<{ id: string }>
}

type Props = {
  defaultTab: string
  customer: StoreCustomer
  orders: StoreOrder[]
  wishlistItems: WishlistItem[]
  productMap: Map<string, SimpleProduct>
}

const VALID_TABS = ["profile", "orders", "wishlist"] as const
type Tab = (typeof VALID_TABS)[number]

function isValidTab(value: string): value is Tab {
  return VALID_TABS.includes(value as Tab)
}

export function AccountTabs({
  defaultTab,
  customer,
  orders,
  wishlistItems,
  productMap,
}: Props) {
  const t = useTranslations("account")
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeTab = isValidTab(defaultTab) ? defaultTab : "profile"

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "profile") {
      params.delete("tab")
    } else {
      params.set("tab", value)
    }
    const query = params.toString()
    router.replace(query ? `?${query}` : "?", { scroll: false })
  }

  return (
    <Tabs defaultValue={activeTab} onValueChange={handleTabChange} orientation="vertical" className="gap-x-12">
      <TabsList
        variant="line"
      >
        <TabsTrigger value="profile" className="gap-2 pb-3">
          <User className="size-4" />
          {t("tabs.profile")}
        </TabsTrigger>
        <TabsTrigger value="orders" className="gap-2 pb-3">
          <Package className="size-4" />
          {t("tabs.orders")}
        </TabsTrigger>
        <TabsTrigger value="wishlist" className="gap-2 pb-3">
          <Heart className="size-4" />
          {t("tabs.wishlist")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="h-screen">
        <div className="space-y-4">
          <ProfileForm customer={customer} />
        </div>
      </TabsContent>

      <TabsContent value="orders" className="h-screen">
        <OrdersTab orders={orders} />
      </TabsContent>

      <TabsContent value="wishlist" className="h-screen">
        <WishlistTab items={wishlistItems} productMap={productMap} />
      </TabsContent>
    </Tabs>
  )
}
