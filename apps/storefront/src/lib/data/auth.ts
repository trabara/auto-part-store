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
    .catch(medusaError)

  return customer
}

export const initiateProviderAuth = async (
  provider: 'google' | 'facebook' | 'apple',
  returnTo?: string
): Promise<string> => {
  const params = new URLSearchParams()
  if (returnTo) params.set("return_to", returnTo)

  const { location } = await sdk.client
    .fetch<{
      location: string
    }>(`/store/oauth/${provider}${params.toString() ? `?${params.toString()}` : ""}`, { method: "GET" })
    .catch(medusaError)

  return location
}

export const getEnabledOAuthProviders = async (): Promise<('google' | 'facebook' | 'apple')[]> => {
  const { enabled_providers } = await sdk.client
    .fetch<{ enabled_providers: string[] }>(`/store/oauth`, { method: "GET" })
    .catch(medusaError)

  return enabled_providers as ('google' | 'facebook' | 'apple')[]
}