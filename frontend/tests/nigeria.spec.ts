import { test, expect } from '@playwright/test';

test('Nigerian copy, local photos, annual rent filters and city tabs', async ({ page }) => {
  await page.route('https://**/*', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-NG');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find Your Dream Home');
  await expect(page.locator('body')).not.toContainText('New York');
  // Annual rents by design — modal shows a monthly *estimate*, not "/month" pricing.
  await expect(page.locator('#properties')).not.toContainText('/month');
  await expect(page.locator('.homy-hero-bg-image')).toBeVisible();
  for (const file of ['home-exterior', 'living-room', 'apartment', 'bedroom']) {
    const decoded = await page.evaluate(async (name) => {
      const image = new Image();
      image.src = `/images/${name}.jpg`;
      await image.decode();
      return image.naturalWidth;
    }, file);
    expect(decoded).toBeGreaterThan(500);
  }
  await page.getByRole('button', { name: 'Abuja', exact: true }).click();
  await expect(page.locator('#properties .property-card')).toHaveCount(6);
  await page.getByRole('checkbox', { name: 'Luxury Collection' }).check();
  await expect(page.locator('#properties .property-card')).toHaveCount(4);
  await page.getByRole('checkbox', { name: 'Luxury Collection' }).uncheck();
  await page.getByRole('button', { name: 'All locations', exact: true }).click();
  await page.getByLabel('Max annual rent').selectOption('2000000');
  await page.getByRole('button', { name: 'Search homes', exact: true }).click();
  await expect(page.locator('#properties .property-card')).toHaveCount(3);
  await page.getByLabel('Sort properties').selectOption('price-low');
  await expect(page.locator('#properties .property-price').first()).toContainText('₦850,000');
  await page.getByLabel('Property Type').selectOption('studio');
  await page.getByRole('button', { name: 'Search homes', exact: true }).click();
  await expect(page.locator('#properties .property-card')).toHaveCount(2);
});

test('desktop and small-screen screenshots, no horizontal overflow', async ({ page }) => {
  await page.route('https://**/*', (route) => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // Scroll real page images into view, then verify decoding AND computed styles.
  const images = page.locator('main img');
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node) => {
      const img = node as HTMLImageElement;
      const style = getComputedStyle(img);
      const rect = img.getBoundingClientRect();
      return img.complete && img.naturalWidth > 0 && style.opacity === '1'
        && style.visibility === 'visible' && rect.bottom > 0 && rect.top < innerHeight;
    })).toBeTruthy();
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/nigeria-desktop.png', fullPage: true });
  await page.locator('#properties .property-card').first().screenshot({ path: 'test-results/nigeria-property.png' });
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/nigeria-mobile.png', fullPage: true });
});
