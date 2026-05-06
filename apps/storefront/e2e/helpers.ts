/**
 * Shared helpers for E2E tests.
 * These utilities are thin wrappers around common Playwright operations
 * (login, seed cookie, etc.) to avoid repetition across test files.
 */
import { Page, request } from "@playwright/test"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:9000"
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com"
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "supersecret"

/** Test customer credentials — must already exist in the backend DB. */
export const TEST_EMAIL = process.env.E2E_EMAIL ?? "e2e@example.com"
export const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "supersecret"

/**
 * Obtain a JWT from the Medusa backend and inject it as the
 * `_medusa_jwt` cookie so tests can skip the UI login flow.
 */
export async function loginViaAPI(page: Page): Promise<void> {
  const ctx = await request.newContext({ baseURL: BACKEND_URL })
  const res = await ctx.post("/auth/customer/emailpass", {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  })
  const body = await res.json()
  const token: string = body.token
  await ctx.dispose()

  // Set cookie on the storefront origin
  await page.context().addCookies([
    {
      name: "_medusa_jwt",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
    },
  ])
}

/** Obtain an admin JWT. */
async function getAdminToken(): Promise<string> {
  const ctx = await request.newContext({ baseURL: BACKEND_URL })
  const res = await ctx.post("/auth/user/emailpass", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })
  const body = await res.json()
  await ctx.dispose()
  return body.token as string
}

/**
 * Create a guest customer (has_account: false) via the admin API.
 * Returns the customer id so the caller can clean up after the test.
 */
export async function createGuestCustomer(
  email: string,
  firstName = "Guest",
  lastName = "User"
): Promise<string> {
  const token = await getAdminToken()
  const ctx = await request.newContext({
    baseURL: BACKEND_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  })
  const res = await ctx.post("/admin/customers", {
    data: { email, first_name: firstName, last_name: lastName },
  })
  const body = await res.json()
  await ctx.dispose()
  return body.customer.id as string
}

/** Delete a customer via the admin API (cleanup after test). */
export async function deleteCustomer(customerId: string): Promise<void> {
  const token = await getAdminToken()
  const ctx = await request.newContext({
    baseURL: BACKEND_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  })
  await ctx.delete(`/admin/customers/${customerId}`)
  await ctx.dispose()
}
