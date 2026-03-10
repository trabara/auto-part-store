"use server"

import { sdk } from "@/lib/config"
import { getCartId, removeCartId } from "@/lib/data/cookies"
import { medusaError } from "@/lib/util/error"
import { HttpTypes, StoreCart } from "@medusajs/types"

const CART_FIELDS =
  "+items,+items.variant_title,+items.variant_sku," +
  "+items.variant,+items.variant.title,+items.variant.sku,+items.variant.thumbnail," +
  "+items.variant.options,+items.variant.options.option_id,+items.variant.options.value," +
  "+items.variant.product,+items.variant.calculated_price," +
  "+items.thumbnail,+items.subtotal,+items.unit_price,+items.total," +
  "+subtotal,+total,+tax_total,+shipping_total,+discount_total," +
  "+email,+shipping_address,+billing_address," +
  "+payment_collection,+payment_collection.payment_sessions," +
  "+shipping_methods,+shipping_methods.shipping_option,+shipping_methods.amount"

export const updateCartContact = async (email: string): Promise<StoreCart> => {
  const cartId = await getCartId()
  if (!cartId) throw new Error("No cart found")

  const { cart } = await sdk.store.cart
    .update(cartId, { email }, { fields: CART_FIELDS })
    .catch(medusaError)

  return cart as StoreCart
}

export const updateCartAddress = async (
  address: Omit<HttpTypes.StoreCartAddress, "id" | "created_at" | "updated_at">
): Promise<StoreCart> => {
  const cartId = await getCartId()
  if (!cartId) throw new Error("No cart found")

  const { cart } = await sdk.store.cart
    .update(
      cartId,
      {
        shipping_address: address,
        billing_address: address,
      },
      { fields: CART_FIELDS }
    )
    .catch(medusaError)

  return cart as StoreCart
}

export const listShippingOptions = async (): Promise<
  HttpTypes.StoreCartShippingOption[]
> => {
  const cartId = await getCartId()
  if (!cartId) return []

  const { shipping_options } = await sdk.store.fulfillment
    .listCartOptions({ cart_id: cartId })
    .catch(() => ({
      shipping_options: [] as HttpTypes.StoreCartShippingOption[],
    }))

  return shipping_options
}

export const selectShippingMethod = async (
  optionId: string
): Promise<StoreCart> => {
  const cartId = await getCartId()
  if (!cartId) throw new Error("No cart found")

  const { cart } = await sdk.store.cart
    .addShippingMethod(cartId, { option_id: optionId }, { fields: CART_FIELDS })
    .catch(medusaError)

  return cart as StoreCart
}

export const initiatePayment = async (
  providerId: string
): Promise<StoreCart> => {
  const cartId = await getCartId()
  if (!cartId) throw new Error("No cart found")

  // Fetch the full cart first (needed by initiatePaymentSession)
  const { cart } = await sdk.store.cart
    .retrieve(cartId, { fields: CART_FIELDS })
    .catch(medusaError)

  // initiatePaymentSession returns { payment_collection }, not the cart
  await sdk.store.payment
    .initiatePaymentSession(cart as StoreCart, { provider_id: providerId })
    .catch(medusaError)

  // Re-fetch the cart so the updated payment_collection is included
  const { cart: updatedCart } = await sdk.store.cart
    .retrieve(cartId, { fields: CART_FIELDS })
    .catch(medusaError)

  return updatedCart as StoreCart
}

export type PlaceOrderResult =
  | { type: "order"; orderId: string }
  | { type: "error"; message: string }

export const placeOrder = async (): Promise<PlaceOrderResult> => {
  const cartId = await getCartId()
  if (!cartId) return { type: "error", message: "No cart found" }

  const result = await sdk.store.cart.complete(cartId).catch(medusaError)

  if (result.type === "order") {
    await removeCartId()
    return { type: "order", orderId: result.order.id }
  }

  return {
    type: "error",
    message: (result as any).error ?? "Failed to place order",
  }
}

export const retrieveOrder = async (
  orderId: string
): Promise<HttpTypes.StoreOrder | null> => {
  return sdk.store.order
    .retrieve(orderId, {
      fields:
        "+items,+items.variant,+items.variant.product," +
        "+items.thumbnail,+items.subtotal,+items.unit_price,+items.total," +
        "+subtotal,+total,+tax_total,+shipping_total,+discount_total," +
        "+shipping_address,+payment_collections,+payment_collections.payment_sessions," +
        "+shipping_methods,+shipping_methods.shipping_option",
    })
    .then(({ order }) => order)
    .catch(() => null)
}
