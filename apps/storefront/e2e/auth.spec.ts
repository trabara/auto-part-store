import { test, expect } from "@playwright/test"
import { TEST_EMAIL, TEST_PASSWORD, loginViaAPI } from "./helpers"

test.describe("Auth — Login page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/en/auth/login")
    // CardTitle renders as a <div data-slot="card-title">, not a semantic heading
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
})

test.describe("Auth — Register page", () => {
  test("renders register form", async ({ page }) => {
    await page.goto("/en/auth/register")
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      /create account/i
    )
    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.getByLabel(/last name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test("has a link back to login", async ({ page }) => {
    await page.goto("/en/auth/register")
    const loginLink = page.getByRole("link", { name: /sign in/i })
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await page.waitForURL("**/auth/login")
  })

  test("shows error when registering with an existing email", async ({
    page,
  }) => {
    await page.goto("/en/auth/register")
    await page.getByLabel(/first name/i).fill("Test")
    await page.getByLabel(/last name/i).fill("User")
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole("button", { name: /create account/i }).click()
    await expect(page.locator(".text-destructive")).toBeVisible({
      timeout: 8000,
    })
  })
})

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
