import { test, expect } from "@playwright/test"

test.describe("Homepage", () => {
  test("renders the page title and header", async ({ page }) => {
    await page.goto("/en")
    await expect(page).toHaveTitle(/SnapStore/)
  })

  test("shows the hero section", async ({ page }) => {
    await page.goto("/en")
    // Hero slides contain a CTA button that links to a shop section
    const heroCta = page.getByRole("link", { name: /shop/i }).first()
    await expect(heroCta).toBeVisible({ timeout: 8000 })
  })

  test("shows categories section", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto("/en")
    // SectionHeading renders as a <p>, scroll into view to ensure visibility
    await page.evaluate(() => window.scrollBy(0, 800))
    await expect(page.getByText("SHOP BY CATEGORY")).toBeVisible({
      timeout: 8000,
    })
  })

  test("header Account button is visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto("/en")
    await expect(page.getByText("Account").first()).toBeVisible()
  })

  test("header Account button links to login for guests", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto("/en")
    const accountLink = page.getByRole("link", { name: /account/i }).first()
    const href = await accountLink.getAttribute("href")
    expect(href).toContain("/auth/login")
  })

  test("locale switcher is visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto("/en")
    // LocaleSwitcher renders a <select> with aria-label="Language"
    await expect(
      page.getByRole("combobox", { name: /language/i })
    ).toBeVisible()
  })

  test("navigating to /fr renders French layout", async ({ page }) => {
    await page.goto("/fr")
    // Use the first match for "À propos" to avoid strict mode violation
    await expect(page.getByText("À propos").first()).toBeVisible()
  })
})
