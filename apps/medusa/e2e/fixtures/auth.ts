import { test as base, type Page } from '@playwright/test';

/**
 * Authentication credentials for testing
 */
export const AUTH_CREDENTIALS = {
    email: 'admin@medusa-test.com',
    password: 'supersecret',
};

/**
 * Extended test fixture with authenticated context
 */
export const test = base.extend<{
    authenticatedPage: Page;
}>({
    authenticatedPage: async ({ page }, use) => {
        // Navigate to login page with retry logic
        let retries = 3;
        let navigated = false;

        for (let i = 0; i < retries; i++) {
            try {
                await page.goto('/app', {
                    waitUntil: 'domcontentloaded',
                    timeout: 20000
                });
                navigated = true;
                break;
            } catch (error) {
                console.log(`Navigation attempt ${i + 1} failed: ${error.message}`);
                if (i < retries - 1) {
                    console.log(`Retrying... (${retries - i - 1} attempts left)`);
                    await page.waitForTimeout(2000).catch(() => { });
                } else {
                    throw new Error(`Failed to navigate to /app after ${retries} attempts: ${error.message}`);
                }
            }
        }

        if (!navigated) {
            throw new Error('Failed to navigate to /app');
        }

        // Wait for page to be ready
        try {
            await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
            await page.waitForTimeout(1500);
        } catch (error) {
            console.log(`Warning: Page load state timeout: ${error.message}`);
        }

        // Check if already logged in
        const submitButton = page.locator('button[type="submit"]');
        const buttonCount = await submitButton.count();
        const isLoggedIn = buttonCount === 0;

        if (!isLoggedIn) {
            // Fill in credentials
            await page.locator('input[type="email"], input[name="email"]').first().fill(AUTH_CREDENTIALS.email);
            await page.locator('input[type="password"], input[name="password"]').first().fill(AUTH_CREDENTIALS.password);

            // Submit login form
            await submitButton.first().click();

            // Wait for navigation after login
            await page.waitForURL('**/app/**', { timeout: 15000 });
            await page.waitForTimeout(1000);
        }

        await use(page);
    },
});

export { expect } from '@playwright/test';
