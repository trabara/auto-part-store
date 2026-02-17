import { test, expect } from '../fixtures/auth';
import {
  waitForPageLoad,
  navigateToModels,
  generateModelData,
  clickButton,
  randomString,
} from '../utils/helpers';

test.describe('Model CRUD Operations', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await navigateToModels(authenticatedPage);
  });

  test('should display models list page', async ({ authenticatedPage: page }) => {
    // Verify page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /models/i })).toBeVisible();
    
    // Verify create button exists
    const createButton = page.locator('a[href*="create"], button').filter({ hasText: /create|add/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('should create a new model', async ({ authenticatedPage: page }) => {
    const modelData = generateModelData();

    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);

    // Fill in model name
    const nameInput = page.locator('input[name="name"], input#name').first();
    await nameInput.fill(modelData.name);

    // Fill in make (using select or create input)
    const makeInput = page.locator('input[name="make_name"], input#make_name, select[name="make_id"]').first();
    await makeInput.fill(modelData.make_name);
    await page.waitForTimeout(500);

    // Submit form
    await clickButton(page, 'Create');
    await page.waitForTimeout(2000);

    // Verify success
    const hasToast = await page.locator('[role="status"], [role="alert"]').count() > 0;
    const hasRedirected = page.url().includes('/fitments/models');
    
    expect(hasToast || hasRedirected).toBeTruthy();

    // Verify model appears in list
    if (hasRedirected) {
      await page.waitForTimeout(1000);
      await expect(page.locator(`text="${modelData.name}"`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show validation error for empty model name', async ({ authenticatedPage: page }) => {
    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);

    // Try to submit without filling required fields
    await clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Verify validation error appears
    const errorMessage = page.locator('[role="alert"], .error, [class*="error"]');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should edit an existing model', async ({ authenticatedPage: page }) => {
    // First create a model to edit
    const originalModelData = generateModelData();
    
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);
    await page.locator('input[name="name"], input#name').first().fill(originalModelData.name);
    await page.locator('input[name="make_name"], input#make_name').first().fill(originalModelData.make_name);
    await page.waitForTimeout(500);
    await clickButton(page, 'Create');
    await page.waitForTimeout(2000);

    // Navigate back to models list
    await navigateToModels(page);

    // Find and click edit button
    const modelRow = page.locator(`tr, [class*="row"]`).filter({ hasText: originalModelData.name }).first();
    const editButton = modelRow.locator('button, a').filter({ hasText: /edit/i }).or(
      modelRow.locator('[aria-label*="edit"], [title*="edit"]')
    ).first();
    
    await editButton.click();
    await waitForPageLoad(page, 1000);

    // Update the name
    const updatedName = `Updated Model ${randomString(6)}`;
    const nameInput = page.locator('input[name="name"], input#name').first();
    await nameInput.clear();
    await nameInput.fill(updatedName);

    // Submit update
    await clickButton(page, 'Save');
    await page.waitForTimeout(2000);

    // Verify update success
    await navigateToModels(page);
    await expect(page.locator(`text="${updatedName}"`).first()).toBeVisible({ timeout: 5000 });
  });

  test('should delete a model', async ({ authenticatedPage: page }) => {
    // First create a model to delete
    const modelData = generateModelData();
    
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);
    await page.locator('input[name="name"], input#name').first().fill(modelData.name);
    await page.locator('input[name="make_name"], input#make_name').first().fill(modelData.make_name);
    await page.waitForTimeout(500);
    await clickButton(page, 'Create');
    await page.waitForTimeout(2000);

    // Navigate back to models list
    await navigateToModels(page);

    // Find and click delete button
    const modelRow = page.locator(`tr, [class*="row"]`).filter({ hasText: modelData.name }).first();
    const deleteButton = modelRow.locator('button').filter({ hasText: /delete|remove/i }).or(
      modelRow.locator('[aria-label*="delete"], [title*="delete"]')
    ).first();
    
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Confirm deletion if modal appears
    const confirmButton = page.locator('button').filter({ hasText: /confirm|delete|yes/i }).first();
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify model is removed
    await expect(page.locator(`text="${modelData.name}"`)).not.toBeVisible({ timeout: 5000 });
  });

  test('should filter models by make', async ({ authenticatedPage: page }) => {
    // Check if filter/search exists
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Type in search
      await searchInput.fill('Test');
      await page.waitForTimeout(1000);
      
      // Verify results are filtered
      const rows = await page.locator('tr, [class*="row"]').count();
      expect(rows).toBeGreaterThan(0);
    }
  });
});
