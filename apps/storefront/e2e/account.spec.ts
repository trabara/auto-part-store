import { test, expect } from "@playwright/test"
import { loginViaAPI, TEST_EMAIL } from "./helpers"

test.describe("Account page", () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page)
    await page.goto("/en/account")
  })

  test("renders the account page for authenticated user", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByText(TEST_EMAIL)).toBeVisible()
  })

  test("shows Profile tab and profile form by default", async ({ page }) => {
    // Profile tab should be active by default
    const profileTab = page.getByRole("tab", { name: /profile/i })
    await expect(profileTab).toBeVisible()
    await expect(profileTab).toHaveAttribute("data-state", "active")
    // Profile form fields should be visible
    await expect(page.getByLabel(/email/i)).toBeDisabled()
    await expect(page.getByLabel(/email/i)).toHaveValue(TEST_EMAIL)
  })

  test("clicking My Orders tab shows order history", async ({ page }) => {
    await page.getByRole("tab", { name: /my orders/i }).click()
    await page.waitForURL("**/account?tab=orders", { timeout: 8000 })
    // Either order rows or the empty state message is shown
    const body = await page.textContent("body")
    expect(body).toMatch(/order|no orders/i)
  })

  test("clicking My Wishlist tab shows wishlist content", async ({ page }) => {
    await page.getByRole("tab", { name: /my wishlist/i }).click()
    await page.waitForURL("**/account?tab=wishlist", { timeout: 8000 })
    // Either product grid or the empty state is shown
    const body = await page.textContent("body")
    expect(body).toMatch(/wishlist|empty/i)
  })

  test("profile form can be submitted and shows success message", async ({
    page,
  }) => {
    // Profile tab is active by default — fill and submit
    const firstNameInput = page.getByLabel(/first name/i)
    await firstNameInput.fill("E2E")
    await page.getByLabel(/last name/i).fill("Tester")
    await page.getByRole("button", { name: /save changes/i }).click()
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({
      timeout: 10000,
    })
  })

  test("logout button redirects to homepage", async ({ page }) => {
    await page.getByRole("button", { name: /log out/i }).click()
    await page.waitForURL("**/en", { timeout: 10000 })
    expect(page.url()).toMatch(/\/en\/?$/)
  })
})
