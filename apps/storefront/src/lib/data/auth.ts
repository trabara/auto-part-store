"use server"

import { sdk } from "@/lib/config"
import {
  getAuthHeaders,
  removeAuthToken,
  setAuthToken,
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

  const authHeaders = await getAuthHeaders()

  const { customer } = await sdk.store.customer
    .retrieve({}, authHeaders)
    .catch(medusaError)

  return customer
}

export const registerCustomer = async ({
  email,
  password,
  firstName,
  lastName,
  phone,
}: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}): Promise<StoreCustomer> => {
  const { token, customer } = await sdk.client
    .fetch<{ token: string; customer: StoreCustomer }>(
      "/store/customers/register",
      {
        method: "POST",
        body: {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
        },
      }
    )
    .catch(medusaError)

  await setAuthToken(token)

  return customer
}

export const logout = async (): Promise<void> => {
  await sdk.auth.logout().catch(medusaError)
  await removeAuthToken()
}

export const updateCustomer = async (data: {
  first_name?: string
  last_name?: string
  phone?: string
}): Promise<StoreCustomer> => {
  const headers = await getAuthHeaders()
  const { customer } = await sdk.store.customer
    .update(data, {}, headers)
    .catch(medusaError)
  return customer
}

export type EmailExistsResult =
  | { status: "none" }
  | { status: "registered" }
  | { status: "guest"; first_name?: string; last_name?: string }

export const checkEmailExists = async (
  email: string
): Promise<EmailExistsResult> => {
  const result = await sdk.client
    .fetch<EmailExistsResult>(
      `/store/customers/exists?email=${encodeURIComponent(email)}`,
      { method: "GET" }
    )
    .catch(medusaError)
  return result
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

  return customer
}
