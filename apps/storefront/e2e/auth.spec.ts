import { test, expect } from "@playwright/test"
import {
  TEST_EMAIL,
  TEST_PASSWORD,
  loginViaAPI,
  createGuestCustomer,
  deleteCustomer,
} from "./helpers"

// ── Login page ────────────────────────────────────────────────────────────────

test.describe("Auth — Login page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/en/auth/login")
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      /sign in/i
    )
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto("/en/auth/login")
    await page.getByLabel(/email/i).fill("wrong@example.com")
    await page.getByLabel(/password/i).fill("wrongpassword")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page.locator(".text-destructive")).toBeVisible({
      timeout: 8000,
    })
  })

  test("redirects to /account after successful login", async ({ page }) => {
    await page.goto("/en/auth/login")
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole("button", { name: /sign in/i }).click()
    await page.waitForURL("**/account", { timeout: 20000 })
    expect(page.url()).toContain("/account")
  })

  test("has a link to the register page", async ({ page }) => {
    await page.goto("/en/auth/login")
    const registerLink = page.getByRole("link", { name: /create one/i })
    await expect(registerLink).toBeVisible()
    await registerLink.click()
    await page.waitForURL("**/auth/register")
    expect(page.url()).toContain("/auth/register")
  })

  test("shows account_exists banner when ?message=account_exists", async ({
    page,
  }) => {
    await page.goto("/en/auth/login?message=account_exists")
    // The banner should be visible and contain relevant copy
    await expect(page.locator(".text-destructive, [role='alert']")).toBeVisible(
      {
        timeout: 5000,
      }
    )
  })
})

// ── Register page — step 1 (email) ────────────────────────────────────────────

test.describe("Auth — Register page (email step)", () => {
  test("renders only the email field on initial load", async ({ page }) => {
    await page.goto("/en/auth/register")
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      /create account/i
    )
    await expect(page.getByLabel(/email/i)).toBeVisible()
    // Name / password fields must NOT be present yet
    await expect(page.getByLabel(/first name/i)).not.toBeVisible()
    await expect(page.getByLabel(/password/i)).not.toBeVisible()
    await expect(page.getByRole("button", { name: /continue/i })).toBeVisible()
  })

  test("has a link back to login", async ({ page }) => {
    await page.goto("/en/auth/register")
    const loginLink = page.getByRole("link", { name: /sign in/i })
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await page.waitForURL("**/auth/login")
  })

  test("shows inline validation error for empty email submission", async ({
    page,
  }) => {
    await page.goto("/en/auth/register")
    await page.getByRole("button", { name: /continue/i }).click()
    // Zod fires client-side — no network request should have been made
    await expect(page.locator(".text-destructive").first()).toBeVisible({
      timeout: 2000,
    })
    // Still on register page, no redirect
    expect(page.url()).toContain("/auth/register")
  })

  test("shows inline validation error for invalid email format", async ({
    page,
  }) => {
    await page.goto("/en/auth/register")
    await page.getByLabel(/email/i).fill("not-an-email")
    await page.getByRole("button", { name: /continue/i }).click()
    await expect(page.locator(".text-destructive").first()).toBeVisible({
      timeout: 2000,
    })
    expect(page.url()).toContain("/auth/register")
  })
})

// ── Register page — new email flow ────────────────────────────────────────────

test.describe("Auth — Register page (new email flow)", () => {
  // Use a unique email guaranteed not to exist
  const newEmail = `e2e-new-${Date.now()}@example.com`

  test("advances to full form for an unknown email", async ({ page }) => {
    await page.goto("/en/auth/register")
    await page.getByLabel(/email/i).fill(newEmail)
    await page.getByRole("button", { name: /continue/i }).click()

    // Should now show first name, last name, password fields
    await expect(page.getByLabel(/first name/i)).toBeVisible({ timeout: 8000 })
    await expect(page.getByLabel(/last name/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    // Email shown read-only
    await expect(page.locator(`input[value="${newEmail}"]`)).toBeVisible()
  })

  test("shows password min-length error on new-email step", async ({
    page,
  }) => {
    await page.goto("/en/auth/register")
    await page.getByLabel(/email/i).fill(newEmail)
    await page.getByRole("button", { name: /continue/i }).click()
    await expect(page.getByLabel(/first name/i)).toBeVisible({ timeout: 8000 })

    await page.getByLabel(/first name/i).fill("Test")
    await page.getByLabel(/last name/i).fill("User")
    await page.getByLabel(/password/i).fill("short")
    await page.getByRole("button", { name: /create account/i }).click()
    await expect(page.locator(".text-destructive").first()).toBeVisible({
      timeout: 2000,
    })
  })

  test("back button returns to email step", async ({ page }) => {
    await page.goto("/en/auth/register")
    await page.getByLabel(/email/i).fill(newEmail)
    await page.getByRole("button", { name: /continue/i }).click()
    await expect(page.getByLabel(/first name/i)).toBeVisible({ timeout: 8000 })

    await page.getByRole("button", { name: /back/i }).click()
    // Should see email field again
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/first name/i)).not.toBeVisible()
  })
})

// ── Register page — already-registered email flow ─────────────────────────────

test.describe("Auth — Register page (registered email flow)", () => {
  test("redirects to /auth/login?message=account_exists for registered email", async ({
    page,
  }) => {
    await page.goto("/en/auth/register")
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByRole("button", { name: /continue/i }).click()
    await page.waitForURL("**/auth/login?message=account_exists", {
      timeout: 10000,
    })
    expect(page.url()).toContain("account_exists")
  })
})

// ── Register page — guest (returning customer) flow ───────────────────────────

test.describe("Auth — Register page (guest flow)", () => {
  let guestEmail: string
  let guestCustomerId: string

  test.beforeAll(async () => {
    guestEmail = `e2e-guest-${Date.now()}@example.com`
    guestCustomerId = await createGuestCustomer(guestEmail, "Alice", "Smith")
  })

  test.afterAll(async () => {
    if (guestCustomerId) {
      await deleteCustomer(guestCustomerId)
    }
  })

  test("shows welcome-back form with pre-filled name for guest email", async ({
    page,
  }) => {
    await page.goto("/en/auth/register")
    await page.getByLabel(/email/i).fill(guestEmail)
    await page.getByRole("button", { name: /continue/i }).click()

    // Title should contain "Welcome back"
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      /welcome back/i,
      { timeout: 8000 }
    )
    // Pre-filled first name
    await expect(page.getByLabel(/first name/i)).toHaveValue("Alice")
    await expect(page.getByLabel(/last name/i)).toHaveValue("Smith")
    // Only password — no email field
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test("shows password min-length error on guest step", async ({ page }) => {
    await page.goto("/en/auth/register")
    await page.getByLabel(/email/i).fill(guestEmail)
    await page.getByRole("button", { name: /continue/i }).click()
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      /welcome back/i,
      { timeout: 8000 }
    )

    await page.getByLabel(/password/i).fill("short")
    await page.getByRole("button", { name: /create account/i }).click()
    await expect(page.locator(".text-destructive").first()).toBeVisible({
      timeout: 2000,
    })
  })

  test("back button from guest step returns to email step", async ({
    page,
  }) => {
    await page.goto("/en/auth/register")
    await page.getByLabel(/email/i).fill(guestEmail)
    await page.getByRole("button", { name: /continue/i }).click()
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      /welcome back/i,
      { timeout: 8000 }
    )

    await page.getByRole("button", { name: /back/i }).click()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})

// ── Protected routes ──────────────────────────────────────────────────────────

test.describe("Auth — Protected routes", () => {
  test("unauthenticated user is redirected from /account to /auth/login", async ({
    page,
  }) => {
    await page.goto("/en/account")
    await page.waitForURL("**/auth/login", { timeout: 10000 })
    expect(page.url()).toContain("/auth/login")
  })

  test("unauthenticated user is redirected from /wishlist to /auth/login", async ({
    page,
  }) => {
    await page.goto("/en/wishlist")
    await page.waitForURL("**/auth/login", { timeout: 10000 })
    expect(page.url()).toContain("/auth/login")
  })
})

// ── Logout ────────────────────────────────────────────────────────────────────

test.describe("Auth — Logout", () => {
  test("logged-in user can log out and is redirected to home", async ({
    page,
  }) => {
    await loginViaAPI(page)
    await page.goto("/en/account")
    await page.getByRole("button", { name: /log out/i }).click()
    await page.waitForURL("**/en", { timeout: 10000 })
    expect(page.url()).toMatch(/\/en\/?$/)
  })
})
