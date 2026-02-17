import { test, expect } from '../fixtures/auth';
import { waitForPageLoad } from '../utils/helpers';

/**
 * Smoke test to verify basic functionality
 * Run this first to ensure the app is working
 */
test.describe('Smoke Tests', () => {
  test('should login successfully', async ({ authenticatedPage: page }) => {
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
    expect(page.url()).toContain('/app');
  });

  test('should access fitments module', async ({ authenticatedPage: page }) => {
    await page.goto('/app/fitments');
    await waitForPageLoad(page);
    
    await expect(page.locator('h1, h2').filter({ hasText: /fitments/i })).toBeVisible();
  });

  test('should have all navigation links', async ({ authenticatedPage: page }) => {
    await page.goto('/app/fitments');
    await waitForPageLoad(page);

    // Check for main navigation items
    const navItems = ['makes', 'models', 'engines'];
    
    for (const item of navItems) {
      const link = page.locator(`a[href*="${item}"]`).first();
      const exists = await link.count() > 0;
      expect(exists).toBeTruthy();
    }
  });
});
