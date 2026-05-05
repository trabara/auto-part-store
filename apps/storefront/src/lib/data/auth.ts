"use server"

import { sdk } from "@/lib/config"
import {
  getAuthHeaders,
  setAuthToken,
  removeAuthToken,
} from "@/lib/data/cookies"
import { medusaError } from "@/lib/util/error"
import { StoreCustomer } from "@medusajs/types"

export const login = async ({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<StoreCustomer> => {
  const headers = await getAuthHeaders()

  const result = await sdk.auth
    .login("customer", "emailpass", { email, password })
    .catch(medusaError)

  if (typeof result === "string") {
    await setAuthToken(result)
  }

  const { customer } = await sdk.store.customer
    .retrieve({}, headers)
    .catch(medusaError)

  return customer as StoreCustomer
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

  const result = await sdk.auth
    .register("customer", "emailpass", { email, password })
    .catch(medusaError)

  if (typeof result === "string") {
    await setAuthToken(result as string)
  }

  const { customer } = await sdk.store.customer
    .create(
      {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
      },
      {},
      headers
    )
    .catch(medusaError)

  return customer as StoreCustomer
}

export const logout = async (): Promise<void> => {
  await sdk.auth.logout().catch(medusaError)
  await removeAuthToken()
}

export const getSession = async (): Promise<StoreCustomer | null> => {
  const headers = await getAuthHeaders()

  const authHeaders = headers as Record<string, string>
  if (!authHeaders.authorization) {
    return null
  }

  const { customer } = await sdk.store.customer
    .retrieve({}, headers)
    .catch(() => ({ customer: null }))

  return customer as StoreCustomer | null
}
