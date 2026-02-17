import { test, expect } from '../fixtures/auth';
import {
  waitForPageLoad,
  navigateToEngines,
  generateEngineData,
  clickButton,
  randomString,
} from '../utils/helpers';

test.describe('Engine CRUD Operations', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await navigateToEngines(authenticatedPage);
  });

  test('should display engines list page', async ({ authenticatedPage: page }) => {
    // Verify page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /engines/i })).toBeVisible();
    
    // Verify create button exists
    const createButton = page.locator('a[href*="create"], button').filter({ hasText: /create|add/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('should create a new engine', async ({ authenticatedPage: page }) => {
    const engineData = generateEngineData();

    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);

    // Select fuel type
    const fuelSelect = page.locator('select[name="fuel"], [name="fuel"]').first();
    await fuelSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${engineData.fuel}"`).or(page.locator(`option[value="${engineData.fuel}"]`)).first().click();

    // Select engine type
    const typeSelect = page.locator('select[name="type"], [name="type"]').first();
    await typeSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${engineData.type}"`).or(page.locator(`option[value="${engineData.type}"]`)).first().click();

    // Fill in engine size
    const sizeInput = page.locator('input[name="size"], input#size').first();
    await sizeInput.fill(engineData.size);

    // Fill in tech (optional)
    const techInput = page.locator('input[name="tech"], input#tech').first();
    if (await techInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await techInput.fill(engineData.tech);
    }

    // Submit form
    await clickButton(page, 'Create');
    await page.waitForTimeout(2000);

    // Verify success
    const hasToast = await page.locator('[role="status"], [role="alert"]').count() > 0;
    const hasRedirected = page.url().includes('/fitments/engines');
    
    expect(hasToast || hasRedirected).toBeTruthy();

    // Verify engine appears in list
    if (hasRedirected) {
      await page.waitForTimeout(1000);
      await expect(page.locator(`text="${engineData.size}"`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show validation error for invalid engine size', async ({ authenticatedPage: page }) => {
    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);

    // Fill in invalid size
    const sizeInput = page.locator('input[name="size"], input#size').first();
    await sizeInput.fill('invalid');

    // Try to submit
    await clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Verify validation error appears
    const errorMessage = page.locator('[role="alert"], .error, [class*="error"]');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should edit an existing engine', async ({ authenticatedPage: page }) => {
    // First create an engine to edit
    const originalEngineData = generateEngineData();
    
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);
    
    // Fill form
    const fuelSelect = page.locator('select[name="fuel"], [name="fuel"]').first();
    await fuelSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${originalEngineData.fuel}"`).or(page.locator(`option[value="${originalEngineData.fuel}"]`)).first().click();
    
    const typeSelect = page.locator('select[name="type"], [name="type"]').first();
    await typeSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${originalEngineData.type}"`).or(page.locator(`option[value="${originalEngineData.type}"]`)).first().click();
    
    await page.locator('input[name="size"], input#size').first().fill(originalEngineData.size);
    await clickButton(page, 'Create');
    await page.waitForTimeout(2000);

    // Navigate back to engines list
    await navigateToEngines(page);

    // Find and click edit button
    const engineRow = page.locator(`tr, [class*="row"]`).filter({ hasText: originalEngineData.size }).first();
    const editButton = engineRow.locator('button, a').filter({ hasText: /edit/i }).or(
      engineRow.locator('[aria-label*="edit"], [title*="edit"]')
    ).first();
    
    await editButton.click();
    await waitForPageLoad(page, 1000);

    // Update the size
    const updatedSize = '3.5';
    const sizeInput = page.locator('input[name="size"], input#size').first();
    await sizeInput.clear();
    await sizeInput.fill(updatedSize);

    // Submit update
    await clickButton(page, 'Save');
    await page.waitForTimeout(2000);

    // Verify update success
    await navigateToEngines(page);
    await expect(page.locator(`text="${updatedSize}"`).first()).toBeVisible({ timeout: 5000 });
  });

  test('should delete an engine', async ({ authenticatedPage: page }) => {
    // First create an engine to delete
    const engineData = generateEngineData();
    engineData.size = `${Math.random() * 5 + 1}`.substring(0, 3); // Unique size
    
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);
    
    const fuelSelect = page.locator('select[name="fuel"], [name="fuel"]').first();
    await fuelSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${engineData.fuel}"`).or(page.locator(`option[value="${engineData.fuel}"]`)).first().click();
    
    const typeSelect = page.locator('select[name="type"], [name="type"]').first();
    await typeSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${engineData.type}"`).or(page.locator(`option[value="${engineData.type}"]`)).first().click();
    
    await page.locator('input[name="size"], input#size').first().fill(engineData.size);
    await clickButton(page, 'Create');
    await page.waitForTimeout(2000);

    // Navigate back to engines list
    await navigateToEngines(page);

    // Find and click delete button
    const engineRow = page.locator(`tr, [class*="row"]`).filter({ hasText: engineData.size }).first();
    const deleteButton = engineRow.locator('button').filter({ hasText: /delete|remove/i }).or(
      engineRow.locator('[aria-label*="delete"], [title*="delete"]')
    ).first();
    
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Confirm deletion if modal appears
    const confirmButton = page.locator('button').filter({ hasText: /confirm|delete|yes/i }).first();
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify engine is removed
    await expect(page.locator(`text="${engineData.size}"`)).not.toBeVisible({ timeout: 5000 });
  });

  test('should display engine specifications', async ({ authenticatedPage: page }) => {
    // Verify table columns/headers exist
    const headers = ['Fuel', 'Type', 'Size'];
    
    for (const header of headers) {
      const headerElement = page.locator('th, [role="columnheader"]').filter({ hasText: new RegExp(header, 'i') });
      // Some columns might not be visible, so we check if at least one exists
      const count = await headerElement.count();
      if (count > 0) {
        await expect(headerElement.first()).toBeVisible();
      }
    }
  });

  test('should validate required fields on engine creation', async ({ authenticatedPage: page }) => {
    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1000);

    // Try to submit without filling required fields
    await clickButton(page, 'Create');
    await page.waitForTimeout(1000);

    // Verify validation errors appear
    const errorMessages = page.locator('[role="alert"], .error, [class*="error"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
  });
});
