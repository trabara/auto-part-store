"use server"

import { sdk } from "@/lib/config"
import { getCartId, setCartId } from "@/lib/data/cookies"
import { getRegion } from "@/lib/data/regions"
import { medusaError } from "@/lib/util/error"
import { StoreCart } from "@medusajs/types"

const CART_FIELDS =
  "+items,+items.variant_title,+items.variant_sku," +
  "+items.variant,+items.variant.title,+items.variant.sku,+items.variant.thumbnail," +
  "+items.variant.options,+items.variant.options.option_id,+items.variant.options.value," +
  "+items.variant.product,+items.variant.calculated_price," +
  "+items.thumbnail,+items.subtotal,+items.unit_price,+items.total," +
  "+subtotal,+total,+tax_total,+shipping_total,+discount_total," +
  "+email,+shipping_address,+billing_address," +
  "+payment_collection,+payment_collection.payment_sessions," +
  "+shipping_methods,+shipping_methods.shipping_option," +
  "+shipping_methods.shipping_option.name,+shipping_methods.amount"

export const retrieveCart = async (
  cartId: string
): Promise<StoreCart | null> => {
  return sdk.store.cart
    .retrieve(cartId, { fields: CART_FIELDS })
    .then(({ cart }) => cart as StoreCart)
    .catch(() => null)
}

export const getOrCreateCart = async (): Promise<StoreCart> => {
  const cartId = await getCartId()

  if (cartId) {
    const cart = await retrieveCart(cartId)
    if (cart) return cart
  }

  const region = await getRegion("tn")
  if (!region) {
    throw new Error("Could not find region for cart creation")
  }

  const { cart } = await sdk.store.cart
    .create({ region_id: region.id })
    .catch(medusaError)

  await setCartId(cart.id)

  return cart as StoreCart
}

export const addToCart = async ({
  variantId,
  quantity,
}: {
  variantId: string
  quantity: number
}): Promise<StoreCart> => {
  const cart = await getOrCreateCart()

  const { cart: updatedCart } = await sdk.store.cart
    .createLineItem(
      cart.id,
      { variant_id: variantId, quantity },
      { fields: CART_FIELDS }
    )
    .catch(medusaError)

  return updatedCart as StoreCart
}

export const updateLineItem = async ({
  cartId,
  lineItemId,
  quantity,
}: {
  cartId: string
  lineItemId: string
  quantity: number
}): Promise<StoreCart> => {
  const { cart } = await sdk.store.cart
    .updateLineItem(cartId, lineItemId, { quantity }, { fields: CART_FIELDS })
    .catch(medusaError)

  return cart as StoreCart
}

export const removeLineItem = async ({
  cartId,
  lineItemId,
}: {
  cartId: string
  lineItemId: string
}): Promise<StoreCart> => {
  const { parent: cart } = await sdk.store.cart
    .deleteLineItem(cartId, lineItemId, { fields: CART_FIELDS })
    .catch(medusaError)

  return cart as StoreCart
}
