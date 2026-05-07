import { StoreOrder } from "@medusajs/types";
import { sdk } from "../config";
import { getAuthHeaders } from "./cookies";

export async function getOrders(): Promise<StoreOrder[]> {
    const headers = await getAuthHeaders()
    return sdk.store.order
        .list(
            {
                fields: "+items,+items.variant,+items.variant.product,+subtotal,+total,+created_at",
            },
            headers as Record<string, string>
        )
        .then(({ orders }) => orders)
        .catch(() => [])
}


export async function getInvoice(orderId: string): Promise<Blob | null> {
    const headers = await getAuthHeaders()
    try {
        const res = await sdk.client.fetch<Blob>(`/store/orders/${orderId}/invoices`, {
            method: "GET",
            headers,
        })
        return new Blob([res], { type: "application/pdf" })
    } catch (error) {
        console.error("Failed to fetch invoice", error)
        return null
    }
}   
