import { Page, expect } from '@playwright/test';

/**
 * Wait for page to load completely
 */
export async function waitForPageLoad(page: Page, timeout: number = 3000) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(timeout);
}

/**
 * Fill input field by label
 */
export async function fillInputByLabel(page: Page, label: string, value: string) {
  const input = page.locator(`label:has-text("${label}")`).locator('..').locator('input, textarea').first();
  await input.fill(value);
}

/**
 * Click button by text
 */
export async function clickButton(page: Page, text: string) {
  await page.locator(`button:has-text("${text}")`).click();
}

/**
 * Verify toast notification appears
 */
export async function verifyToast(page: Page, message: string) {
  const toast = page.locator(`[role="status"], [role="alert"]`).filter({ hasText: message });
  await expect(toast).toBeVisible({ timeout: 5000 });
}

/**
 * Verify form validation error
 */
export async function verifyValidationError(page: Page, errorMessage: string) {
  const error = page.locator('[role="alert"], .error, [class*="error"]').filter({ hasText: errorMessage });
  await expect(error).toBeVisible({ timeout: 3000 });
}

/**
 * Generate random string for testing
 */
export function randomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate test data for Make
 */
export function generateMakeData() {
  return {
    name: `Test Make ${randomString(6)}`,
  };
}

/**
 * Generate test data for Model
 */
export function generateModelData() {
  return {
    name: `Test Model ${randomString(6)}`,
    make_name: `Test Make ${randomString(6)}`,
  };
}

/**
 * Generate test data for Engine
 */
export function generateEngineData() {
  return {
    fuel: 'GASOLINE',
    type: 'I4',
    size: '2.0',
    tech: 'Turbo',
  };
}

/**
 * Generate test data for Fitment
 */
export function generateFitmentData() {
  return {
    make_name: `Make ${randomString(6)}`,
    model_name: `Model ${randomString(6)}`,
    year_start: 2020,
    year_end: 2024,
    body_style: 'SEDAN',
    drive: 'FWD',
    transmission: 'AUTOMATIC',
    doors: 4,
    fuel: 'GASOLINE',
    engine_type: 'I4',
    engine_size: '2.0',
  };
}

/**
 * Close modal/drawer by pressing Escape
 */
export async function closeModal(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

/**
 * Navigate to fitments page
 */
export async function navigateToFitments(page: Page) {
  await page.goto('/app/fitments');
  await waitForPageLoad(page);
}

/**
 * Navigate to makes page
 */
export async function navigateToMakes(page: Page) {
  await page.goto('/app/fitments/makes');
  await waitForPageLoad(page);
}

/**
 * Navigate to models page
 */
export async function navigateToModels(page: Page) {
  await page.goto('/app/fitments/models');
  await waitForPageLoad(page);
}

/**
 * Navigate to engines page
 */
export async function navigateToEngines(page: Page) {
  await page.goto('/app/fitments/engines');
  await waitForPageLoad(page);
}
