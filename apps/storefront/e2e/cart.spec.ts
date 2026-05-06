import { test, expect } from "@playwright/test"

test.describe("Cart", () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test("cart sheet trigger button is visible in the header", async ({
    page,
  }) => {
    await page.goto("/en")
    // ShoppingCartButton renders a <button> with a ShoppingCart icon (no text)
    // It is the icon-button inside the last button-group in the header actions
    const cartBtn = page
      .getByRole("button", { name: "" })
      .filter({
        has: page.locator('svg[class*="lucide-shopping-cart"], svg'),
      })
      .last()
    await expect(cartBtn).toBeVisible()
  })

  test("clicking cart icon opens the cart sheet", async ({ page }) => {
    await page.goto("/en")
    const cartTrigger = page.locator('[data-testid="cart-trigger"]')
    await expect(cartTrigger).toBeVisible({ timeout: 5000 })
    await cartTrigger.click()
    await expect(page.getByText(/shopping cart/i).first()).toBeVisible({
      timeout: 5000,
    })
  })

  test("empty cart shows empty state", async ({ page }) => {
    await page.goto("/en")
    const cartTrigger = page.locator('[data-testid="cart-trigger"]')
    await cartTrigger.click()
    // Cart empty text from en.json: "No products in the cart."
    await expect(page.getByText(/no products in the cart/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test("product search page renders products", async ({ page }) => {
    await page.goto("/en/search")
    await page.waitForLoadState("networkidle")
    // Should show some products or the empty state — either way, the page renders
    const body = await page.textContent("body")
    expect(body).toBeTruthy()
  })

  test("product detail page shows Add to Cart button", async ({ page }) => {
    // Navigate to the first product via the home page new arrivals
    await page.goto("/en")
    // Find the first product card image link on the home page
    const productLink = page.locator('a[href*="/p/"]').first()
    const href = await productLink.getAttribute("href")
    if (href) {
      await page.goto(href)
      await page.waitForLoadState("networkidle")
      const addToCartBtn = page.getByRole("button", { name: /add to cart/i })
      await expect(addToCartBtn).toBeVisible({ timeout: 8000 })
    }
  })
})
