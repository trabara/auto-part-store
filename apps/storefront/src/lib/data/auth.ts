"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders, setAuthToken, removeAuthToken } from "@/lib/data/cookies"
import { medusaError } from "@/lib/util/error"
import { StoreAuthCustomer, StoreCustomer } from "@medusajs/types"

export const login = async ({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<StoreAuthCustomer> => {
  const headers = await getAuthHeaders()

  const { customer } = await sdk.store.auth
    .login({ email, password }, {}, headers)
    .catch(medusaError)

  if (customer?.access_token) {
    await setAuthToken(customer.access_token)
  }

  return customer as StoreAuthCustomer
}

export const register = async ({
  email,
  password,
  firstName,
  lastName,
  phone,
}: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}): Promise<StoreCustomer> => {
  const headers = await getAuthHeaders()

  const { customer } = await sdk.store.auth
    .register(
      {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
      },
      {},
      headers
    )
    .catch(medusaError)

  if (customer?.access_token) {
    await setAuthToken(customer.access_token)
  }

  return customer as StoreCustomer
}

export const logout = async (): Promise<void> => {
  const headers = await getAuthHeaders()

  await sdk.store.auth.delete({}, headers).catch(medusaError)

  await removeAuthToken()
}

export const getSession = async (): Promise<StoreCustomer | null> => {
  const headers = await getAuthHeaders()

  if (!headers.authorization) {
    return null
  }

  const { customer } = await sdk.store.auth
    .getSession({}, headers)
    .catch(() => ({ customer: null }))

  return customer as StoreCustomer | null
}