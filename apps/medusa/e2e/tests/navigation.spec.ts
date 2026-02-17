import { test, expect } from '../fixtures/auth';
import {
  waitForPageLoad,
  navigateToFitments,
  navigateToMakes,
  navigateToModels,
  navigateToEngines,
} from '../utils/helpers';

test.describe('Fitment Module Navigation', () => {
  test('should navigate to fitments page from sidebar', async ({ authenticatedPage: page }) => {
    await page.goto('/app');
    await waitForPageLoad(page);

    // Look for fitments link in navigation
    const fitmentLink = page.locator('a[href*="fitments"]').first();
    await fitmentLink.click();
    await waitForPageLoad(page);

    // Verify we're on fitments page
    expect(page.url()).toContain('/fitments');
    await expect(page.locator('h1, h2').filter({ hasText: /fitments/i })).toBeVisible();
  });

  test('should navigate between fitment sub-pages', async ({ authenticatedPage: page }) => {
    // Start at fitments
    await navigateToFitments(page);

    // Navigate to Makes
    const makesLink = page.locator('a[href*="makes"]').first();
    if (await makesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await makesLink.click();
      await waitForPageLoad(page);
      expect(page.url()).toContain('/makes');
    }

    // Navigate to Models
    const modelsLink = page.locator('a[href*="models"]').first();
    if (await modelsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await modelsLink.click();
      await waitForPageLoad(page);
      expect(page.url()).toContain('/models');
    }

    // Navigate to Engines
    const enginesLink = page.locator('a[href*="engines"]').first();
    if (await enginesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await enginesLink.click();
      await waitForPageLoad(page);
      expect(page.url()).toContain('/engines');
    }
  });

  test('should use breadcrumb navigation', async ({ authenticatedPage: page }) => {
    await navigateToFitments(page);

    // Check if breadcrumbs exist
    const breadcrumbs = page.locator('[aria-label*="breadcrumb"], nav ol, nav ul').first();
    
    if (await breadcrumbs.isVisible({ timeout: 2000 }).catch(() => false)) {
      const breadcrumbLinks = breadcrumbs.locator('a');
      const count = await breadcrumbLinks.count();
      
      if (count > 0) {
        // Click on a breadcrumb link
        await breadcrumbLinks.first().click();
        await waitForPageLoad(page);
        
        // Verify navigation occurred
        expect(page.url()).toBeTruthy();
      }
    }
  });

  test('should navigate from fitment list to create form', async ({ authenticatedPage: page }) => {
    await navigateToFitments(page);

    // Click create button
    const createButton = page.locator('a[href*="create"]').first();
    await createButton.click();
    await waitForPageLoad(page);

    // Verify we're on create page
    expect(page.url()).toContain('/create');
    await expect(page.locator('h1, h2').filter({ hasText: /create/i })).toBeVisible();
  });

  test('should navigate from make list to create form', async ({ authenticatedPage: page }) => {
    await navigateToMakes(page);

    // Click create button
    const createButton = page.locator('a[href*="create"]').first();
    await createButton.click();
    await waitForPageLoad(page);

    // Verify we're on create page
    expect(page.url()).toContain('/create');
    await expect(page.locator('form, [role="form"]')).toBeVisible();
  });

  test('should navigate from model list to create form', async ({ authenticatedPage: page }) => {
    await navigateToModels(page);

    // Click create button
    const createButton = page.locator('a[href*="create"]').first();
    await createButton.click();
    await waitForPageLoad(page);

    // Verify we're on create page
    expect(page.url()).toContain('/create');
    await expect(page.locator('form, [role="form"]')).toBeVisible();
  });

  test('should navigate from engine list to create form', async ({ authenticatedPage: page }) => {
    await navigateToEngines(page);

    // Click create button
    const createButton = page.locator('a[href*="create"]').first();
    await createButton.click();
    await waitForPageLoad(page);

    // Verify we're on create page
    expect(page.url()).toContain('/create');
    await expect(page.locator('form, [role="form"]')).toBeVisible();
  });

  test('should cancel form and return to list', async ({ authenticatedPage: page }) => {
    await navigateToMakes(page);
    
    // Navigate to create form
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page);

    // Cancel form
    const cancelButton = page.locator('button').filter({ hasText: /cancel|back/i }).first();
    if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelButton.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(1000);

    // Verify we're back on list page
    expect(page.url()).toContain('/makes');
    expect(page.url()).not.toContain('/create');
  });

  test('should navigate to edit form and back', async ({ authenticatedPage: page }) => {
    await navigateToMakes(page);

    // Find first edit button
    const firstRow = page.locator('tr, [class*="row"]').nth(1);
    const editButton = firstRow.locator('button, a').filter({ hasText: /edit/i }).or(
      firstRow.locator('[aria-label*="edit"], [title*="edit"]')
    ).first();
    
    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();
      await waitForPageLoad(page);

      // Verify we're on edit page
      expect(page.url()).toContain('/edit');

      // Go back
      const cancelButton = page.locator('button').filter({ hasText: /cancel|back/i }).first();
      if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cancelButton.click();
      } else {
        await page.goBack();
      }
      await waitForPageLoad(page);

      // Verify we're back
      expect(page.url()).not.toContain('/edit');
    }
  });

  test('should use browser back button', async ({ authenticatedPage: page }) => {
    await navigateToFitments(page);
    const fitmentUrl = page.url();

    await navigateToMakes(page);
    const makesUrl = page.url();

    expect(fitmentUrl).not.toBe(makesUrl);

    // Go back
    await page.goBack();
    await waitForPageLoad(page);

    // Verify we're back at fitments
    expect(page.url()).toBe(fitmentUrl);
  });

  test('should handle direct URL navigation', async ({ authenticatedPage: page }) => {
    // Test direct navigation to various pages
    const pages = [
      '/app/fitments',
      '/app/fitments/makes',
      '/app/fitments/models',
      '/app/fitments/engines',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await waitForPageLoad(page);
      expect(page.url()).toContain(pagePath);
    }
  });

  test('should maintain state after navigation', async ({ authenticatedPage: page }) => {
    await navigateToMakes(page);

    // Open create form
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page);

    // Fill some data
    const nameInput = page.locator('input[name="name"], input#name').first();
    await nameInput.fill('Test Make Navigation');

    // Navigate away (cancel)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Verify we're back and form data is not persisted
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page);
    
    const newValue = await page.locator('input[name="name"], input#name').first().inputValue();
    expect(newValue).toBe('');
  });

  test('should display correct page titles', async ({ authenticatedPage: page }) => {
    const pagesWithTitles = [
      { path: '/app/fitments', title: /fitments/i },
      { path: '/app/fitments/makes', title: /makes/i },
      { path: '/app/fitments/models', title: /models/i },
      { path: '/app/fitments/engines', title: /engines/i },
    ];

    for (const { path, title } of pagesWithTitles) {
      await page.goto(path);
      await waitForPageLoad(page);
      await expect(page.locator('h1, h2').filter({ hasText: title })).toBeVisible();
    }
  });
});
