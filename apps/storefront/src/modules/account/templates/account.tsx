'use client';

import { StoreCustomer, StoreOrder, StoreProduct } from "@medusajs/types";
import { User } from "lucide-react";
import { AccountTabs } from "../components/account-tabs";
import { LogoutButton } from "../components/logout-button";

type AccountTemplateProps = {
    customer: StoreCustomer
    activeTab: string
    orders: StoreOrder[]
    wishlistProductMap: Map<string, StoreProduct>
}
export default function AccountTemplate({ customer, activeTab, orders, wishlistProductMap }: AccountTemplateProps) {

    return (
        <AccountTabs
            defaultTab={activeTab}
            customer={customer}
            orders={orders}
            wishlistProductMap={wishlistProductMap}
        />
    )
}