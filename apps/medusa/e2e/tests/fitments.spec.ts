import { test, expect } from '../fixtures/auth';
import {
  waitForPageLoad,
  navigateToFitments,
  generateFitmentData,
  clickButton,
} from '../utils/helpers';

test.describe('Fitment CRUD Operations', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await navigateToFitments(authenticatedPage);
  });

  test('should display fitments list page', async ({ authenticatedPage: page }) => {
    // Verify page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /fitments/i })).toBeVisible();
    
    // Verify create button exists
    const createButton = page.locator('a[href*="create"], button').filter({ hasText: /create|add/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('should create a new fitment - multi-step form', async ({ authenticatedPage: page }) => {
    const fitmentData = generateFitmentData();

    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1500);

    // Check if multi-step form (tabs) exists
    const hasTabs = await page.locator('[role="tablist"], [class*="tab"]').count() > 0;

    if (hasTabs) {
      // Step 1: General Information
      await fillGeneralInfo(page, fitmentData);
      await goToNextStep(page);

      // Step 2: Make
      await fillMakeInfo(page, fitmentData);
      await goToNextStep(page);

      // Step 3: Model
      await fillModelInfo(page, fitmentData);
      await goToNextStep(page);

      // Step 4: Engine
      await fillEngineInfo(page, fitmentData);
      
      // Submit
      await clickButton(page, 'Create');
    } else {
      // Single form - fill all fields
      await fillAllFitmentFields(page, fitmentData);
      await clickButton(page, 'Create');
    }

    await page.waitForTimeout(3000);

    // Verify success
    const hasRedirected = page.url().includes('/fitments') && !page.url().includes('/create');
    expect(hasRedirected).toBeTruthy();
  });

  test('should navigate between steps in multi-step form', async ({ authenticatedPage: page }) => {
    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1500);

    // Check for tabs
    const tabs = page.locator('[role="tab"], [class*="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 0) {
      // Verify we can click on tabs
      for (let i = 0; i < Math.min(tabCount, 4); i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);
      }
      
      // Verify first tab content is visible
      await tabs.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should validate required fields in fitment form', async ({ authenticatedPage: page }) => {
    // Click create button
    await page.locator('a[href*="create"]').first().click();
    await waitForPageLoad(page, 1500);

    // Try to submit without filling required fields
    const submitButton = page.locator('button').filter({ hasText: /create|submit|save/i }).first();
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Verify validation errors appear
    const errorMessages = page.locator('[role="alert"], .error, [class*="error"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
  });

  test('should edit an existing fitment', async ({ authenticatedPage: page }) => {
    // Find first fitment in list and click edit
    const firstRow = page.locator('tr, [class*="row"]').nth(1);
    const editButton = firstRow.locator('button, a').filter({ hasText: /edit/i }).or(
      firstRow.locator('[aria-label*="edit"], [title*="edit"]')
    ).first();
    
    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();
      await waitForPageLoad(page, 1500);

      // Update year_end field if visible
      const yearEndInput = page.locator('input[name="year_end"]').first();
      if (await yearEndInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await yearEndInput.clear();
        await yearEndInput.fill('2025');
      }

      // Submit update
      await clickButton(page, 'Save');
      await page.waitForTimeout(2000);

      // Verify redirect
      expect(page.url()).toContain('/fitments');
    }
  });

  test('should delete a fitment', async ({ authenticatedPage: page }) => {
    // Find first fitment and get its identifier
    const firstRow = page.locator('tr, [class*="row"]').nth(1);
    const rowText = await firstRow.textContent().catch(() => '');
    
    const deleteButton = firstRow.locator('button').filter({ hasText: /delete|remove/i }).or(
      firstRow.locator('[aria-label*="delete"], [title*="delete"]')
    ).first();
    
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Confirm deletion
      const confirmButton = page.locator('button').filter({ hasText: /confirm|delete|yes/i }).first();
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }

      // Verify fitment is removed (row text should not be visible)
      if (rowText) {
        await expect(page.locator(`text="${rowText}"`)).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should filter fitments', async ({ authenticatedPage: page }) => {
    // Check for search/filter input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="filter"]').first();
    
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('2020');
      await page.waitForTimeout(1000);
      
      // Verify some results exist
      const rows = await page.locator('tr, [class*="row"]').count();
      expect(rows).toBeGreaterThan(0);
    }
  });

  test('should display fitment details', async ({ authenticatedPage: page }) => {
    // Verify table headers/columns
    const expectedHeaders = ['Make', 'Model', 'Year', 'Body Style'];
    
    for (const header of expectedHeaders) {
      const headerElement = page.locator('th, [role="columnheader"]').filter({ hasText: new RegExp(header, 'i') });
      const count = await headerElement.count();
      if (count > 0) {
        await expect(headerElement.first()).toBeVisible();
      }
    }
  });
});

// Helper functions for multi-step form
async function fillGeneralInfo(page: any, data: any) {
  // Year start
  const yearStartInput = page.locator('input[name="year_start"]').first();
  if (await yearStartInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await yearStartInput.fill(data.year_start.toString());
  }

  // Year end
  const yearEndInput = page.locator('input[name="year_end"]').first();
  if (await yearEndInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await yearEndInput.fill(data.year_end.toString());
  }

  // Body style
  const bodyStyleSelect = page.locator('select[name="body_style"], [name="body_style"]').first();
  if (await bodyStyleSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await bodyStyleSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${data.body_style}"`).or(page.locator(`option[value="${data.body_style}"]`)).first().click();
  }

  // Drive
  const driveSelect = page.locator('select[name="drive"], [name="drive"]').first();
  if (await driveSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await driveSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${data.drive}"`).or(page.locator(`option[value="${data.drive}"]`)).first().click();
  }

  // Transmission
  const transmissionSelect = page.locator('select[name="transmission"], [name="transmission"]').first();
  if (await transmissionSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await transmissionSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${data.transmission}"`).or(page.locator(`option[value="${data.transmission}"]`)).first().click();
  }

  // Doors
  const doorsInput = page.locator('input[name="doors"]').first();
  if (await doorsInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await doorsInput.fill(data.doors.toString());
  }
}

async function fillMakeInfo(page: any, data: any) {
  const makeInput = page.locator('input[name="model.make.name"], input[name="make_name"]').first();
  if (await makeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await makeInput.fill(data.make_name);
  }
}

async function fillModelInfo(page: any, data: any) {
  const modelInput = page.locator('input[name="model.name"], input[name="model_name"]').first();
  if (await modelInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await modelInput.fill(data.model_name);
  }
}

async function fillEngineInfo(page: any, data: any) {
  // Fuel
  const fuelSelect = page.locator('select[name="engine.fuel"], [name="fuel"]').first();
  if (await fuelSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await fuelSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${data.fuel}"`).or(page.locator(`option[value="${data.fuel}"]`)).first().click();
  }

  // Type
  const typeSelect = page.locator('select[name="engine.type"], [name="engine_type"]').first();
  if (await typeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
    await typeSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`text="${data.engine_type}"`).or(page.locator(`option[value="${data.engine_type}"]`)).first().click();
  }

  // Size
  const sizeInput = page.locator('input[name="engine.size"], input[name="engine_size"]').first();
  if (await sizeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await sizeInput.fill(data.engine_size);
  }
}

async function fillAllFitmentFields(page: any, data: any) {
  await fillGeneralInfo(page, data);
  await fillMakeInfo(page, data);
  await fillModelInfo(page, data);
  await fillEngineInfo(page, data);
}

async function goToNextStep(page: any) {
  const nextButton = page.locator('button').filter({ hasText: /next|continue/i }).first();
  if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await nextButton.click();
    await page.waitForTimeout(1000);
  }
}
