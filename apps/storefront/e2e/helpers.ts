/**
 * Shared helpers for E2E tests.
 * These utilities are thin wrappers around common Playwright operations
 * (login, seed cookie, etc.) to avoid repetition across test files.
 */
import { Page, request } from "@playwright/test"
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:9000"

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
