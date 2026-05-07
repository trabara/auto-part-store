"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrdersTab } from "@/modules/account/components/orders-tab"
import { ProfileForm } from "@/modules/account/components/profile-form"
import { WishlistTab } from "@/modules/account/components/wishlist-tab"
import type { StoreCustomer, StoreOrder, StoreProduct } from "@medusajs/types"
import { Heart, Package, User } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"


type AccountTabsProps = {
  defaultTab: string
  customer: StoreCustomer
  orders: StoreOrder[]
  wishlistProductMap: Map<string, StoreProduct>
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
  wishlistProductMap,
}: AccountTabsProps) {
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
    <Tabs defaultValue={activeTab} onValueChange={handleTabChange} orientation="vertical" className="gap-x-24">
      <TabsList
        className="w-60"
        variant='line'
      >
        <TabsTrigger value="profile" className="gap-2 pb-3">
          <User className="size-5" />
          {t("tabs.profile")}
        </TabsTrigger>
        <TabsTrigger value="orders" className="gap-2 pb-3">
          <Package className="size-5" />
          {t("tabs.orders")}
        </TabsTrigger>
        <TabsTrigger value="wishlist" className="gap-2 pb-3">
          <Heart className="size-5" />
          {t("tabs.wishlist")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="h-screen">
        <ProfileForm customer={customer} />
      </TabsContent>

      <TabsContent value="orders" className="h-screen">
        <OrdersTab orders={orders} />
      </TabsContent>

      <TabsContent value="wishlist" className="h-screen">
        <WishlistTab productMap={wishlistProductMap} />
      </TabsContent>
    </Tabs>
  )
}
