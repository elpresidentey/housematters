import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.route('https://**/*', (route) => route.abort());
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('saved homes: save, navbar pill, saved-only filter, persistence across reload', async ({ page }) => {
  await expect(page.locator('.saved-pill')).toHaveCount(0);
  const grid = page.locator('#properties');
  const heart = grid.locator('.save-heart').first();
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.saved-pill')).toHaveText('♥ 1');
  await grid.locator('.save-heart').nth(1).click();
  await expect(page.locator('.saved-pill')).toHaveText('♥ 2');
  await page.getByRole('checkbox', { name: /Saved homes/ }).check();
  await expect(grid.locator('.property-card')).toHaveCount(2);
  await expect(grid.locator('.property-card').first()).toBeVisible();
  await page.reload();
  await expect(page.locator('.saved-pill')).toHaveText('♥ 2');
  await expect(grid.locator('.save-heart[aria-pressed="true"]')).toHaveCount(2);
  await grid.locator('.save-heart').first().click();
  await expect(page.locator('.saved-pill')).toHaveText('♥ 1');
  await page.evaluate(() => localStorage.removeItem('hm:saved-homes'));
});