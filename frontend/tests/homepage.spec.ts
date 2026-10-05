import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Make tests independent of external font/image services.
  await page.route('https://**/*', (route) => route.abort());
});

test('homepage hydrates, badges are styled, search filters and resets', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  // 18 listing-grid cards; the featured rail reuses the same card component.
  await expect(page.locator('#properties .property-card')).toHaveCount(18);
  await expect(page.locator('#properties .property-badge').first()).toHaveText('Featured');
  await expect(page.locator('#properties .property-price').first()).toContainText('₦4,500,000');
  await expect(page.locator('.search-inputs')).toHaveCSS('display', 'grid');
  await page.getByLabel('Location', { exact: true }).fill('Yaba');
  await page.getByRole('button', { name: 'Search homes', exact: true }).click();
  await expect(page.locator('#properties .property-card')).toHaveCount(1);
  await expect(page.locator('#properties .property-title').first()).toContainText('Cosy self-contained studio');
  await page.getByLabel('Location', { exact: true }).fill('No such location');
  await page.getByRole('button', { name: 'Search homes', exact: true }).click();
  await expect(page.locator('.empty-state')).toBeVisible();
  await page.getByRole('button', { name: 'View all properties' }).click();
  await expect(page.locator('#properties .property-card')).toHaveCount(18);
  expect(errors).toEqual([]);
});

test('property dialog and toast have styles, Escape restores focus', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#properties .property-card', { hasText: 'Bright 2-bedroom flat' }).first();
  const opener = card.getByRole('button', { name: /View details for Bright 2-bedroom flat/ });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Modal carries more than the card: facts, amenities, questions, actions.
  await expect(dialog.locator('.detail-quick-facts')).toBeVisible();
  await expect(dialog.locator('.detail-amenities')).toBeVisible();
  await expect(dialog.locator('.questions-list')).toBeVisible();
  await expect(dialog.locator('.detail-monthly')).toContainText('/month');
  await expect(dialog.locator('.modal-content')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(dialog.locator('.modal-header')).toHaveCSS('display', 'flex');
  const box = await dialog.locator('.modal-content').boundingBox();
  expect(box?.width).toBeGreaterThan(420);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await page.getByRole('button', { name: 'Contact Landlord' }).click();
  const toast = page.locator('.toast-stack .notification');
  await expect(toast).toContainText('Messaging feature will be available soon');
  await expect(toast).toHaveCSS('display', 'flex');
  await expect(toast).toHaveCSS('background-color', 'rgb(23, 99, 74)');
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(toast).toHaveCount(0);
});

test('auth forms are styled, validate passwords, and handle API failure', async ({ page }) => {
  await page.goto('/');
  // Auth actions live inside the full-screen menu, so open it first.
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
  const form = page.locator('.auth-form');
  await expect(form).toHaveCSS('display', 'flex');
  await expect(page.locator('.form-row')).toHaveCSS('display', 'grid');
  await page.getByLabel('I am a:').selectOption('tenant');
  await page.getByLabel('First Name').fill('Test');
  await page.getByLabel('Last Name').fill('Person');
  await page.getByLabel('Email Address').fill('test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Testpass1!');
  await page.getByLabel('Confirm Password').fill('Different1!');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(form.getByRole('alert')).toHaveText('Passwords do not match');
  await page.getByRole('link', { name: 'Sign in here' }).click();
  await page.route('**/api/auth/login', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, error: { message: 'API unavailable for test' } }) }));
  await page.getByLabel('Email Address').fill('test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Testpass1!');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(form.getByRole('alert')).toHaveText('API unavailable for test');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('mobile navigation and layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#nav-menu')).toBeVisible();
  await page.locator('#nav-menu').getByRole('link', { name: 'About' }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
