import { test, expect } from '../fixtures/auth';
import {
  waitForPageLoad,
  navigateToMakes,
  generateMakeData,
  clickButton,
  verifyToast,
  randomString,
} from '../utils/helpers';

test.describe('Make CRUD Operations', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await navigateToMakes(authenticatedPage);
  });

  test('should display makes list page', async ({ authenticatedPage: page }) => {
    // Verify page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /makes/i })).toBeVisible();
    
    // Verify create button exists
    const createButton = page.locator('a[href*="create"], button').filter({ hasText: /create|add/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('should create a new make', async ({ authenticatedPage: page }) => {
    const makeData = generateMakeData();

    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);

    // Fill in make name
    const nameInput = page.locator('input[name="name"], input#name').first();
    await nameInput.fill(makeData.name);

    // Submit form
    await clickButton(page, 'Create');
    await page.waitForTimeout(2000);

    // Verify success - either toast or redirect to list
    const hasToast = await page.locator('[role="status"], [role="alert"]').count() > 0;
    const hasRedirected = page.url().includes('/fitments/makes');
    
    expect(hasToast || hasRedirected).toBeTruthy();

    // Verify make appears in list
    if (hasRedirected) {
      await page.waitForTimeout(1000);
      await expect(page.locator(`text="${makeData.name}"`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show validation error for empty make name', async ({ authenticatedPage: page }) => {
    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);

    // Try to submit without filling name
    await clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Verify validation error appears
    const errorMessage = page.locator('[role="alert"], .error, [class*="error"]');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should edit an existing make', async ({ authenticatedPage: page }) => {
    // First create a make to edit
    const originalMakeData = generateMakeData();
    
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);
    await page.locator('input[name="name"], input#name').first().fill(originalMakeData.name);
    await clickButton(page, 'Create');
    await page.waitForTimeout(2000);

    // Navigate back to makes list
    await navigateToMakes(page);

    // Find and click edit button for the created make
    const makeRow = page.locator(`tr, [class*="row"]`).filter({ hasText: originalMakeData.name }).first();
    const editButton = makeRow.locator('button, a').filter({ hasText: /edit/i }).or(
      makeRow.locator('[aria-label*="edit"], [title*="edit"]')
    ).first();
    
    await editButton.click();
    await waitForPageLoad(page, 1000);

    // Update the name
    const updatedName = `Updated ${randomString(6)}`;
    const nameInput = page.locator('input[name="name"], input#name').first();
    await nameInput.clear();
    await nameInput.fill(updatedName);

    // Submit update
    await clickButton(page, 'Save');
    await page.waitForTimeout(2000);

    // Verify update success
    await navigateToMakes(page);
    await expect(page.locator(`text="${updatedName}"`).first()).toBeVisible({ timeout: 5000 });
  });

  test('should delete a make', async ({ authenticatedPage: page }) => {
    // First create a make to delete
    const makeData = generateMakeData();
    
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);
    await page.locator('input[name="name"], input#name').first().fill(makeData.name);
    await clickButton(page, 'Create');
    await page.waitForTimeout(2000);

    // Navigate back to makes list
    await navigateToMakes(page);

    // Find and click delete button
    const makeRow = page.locator(`tr, [class*="row"]`).filter({ hasText: makeData.name }).first();
    const deleteButton = makeRow.locator('button').filter({ hasText: /delete|remove/i }).or(
      makeRow.locator('[aria-label*="delete"], [title*="delete"]')
    ).first();
    
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Confirm deletion if modal appears
    const confirmButton = page.locator('button').filter({ hasText: /confirm|delete|yes/i }).first();
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify make is removed from list
    await expect(page.locator(`text="${makeData.name}"`)).not.toBeVisible({ timeout: 5000 });
  });

  test('should cancel make creation', async ({ authenticatedPage: page }) => {
    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);

    // Fill some data
    await page.locator('input[name="name"], input#name').first().fill('Test Cancel');

    // Click cancel or press Escape
    const cancelButton = page.locator('button').filter({ hasText: /cancel/i }).first();
    if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelButton.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await page.waitForTimeout(1000);

    // Verify returned to makes list
    await expect(page.locator('h1, h2').filter({ hasText: /makes/i })).toBeVisible();
  });
});
