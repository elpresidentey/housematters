import { test } from '@playwright/test';

test('diag: reveal sections visibility during scroll', async ({ page }) => {
  await page.route('https://**/*', (route) => route.abort());
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const sections = page.locator('.reveal');
    const count = await sections.count();
    console.log(`--- width ${width}: ${count} reveal sections ---`);
    for (let i = 0; i < count; i++) {
      const el = sections.nth(i);
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const info = await el.evaluate((node) => {
        const s = getComputedStyle(node);
        const r = node.getBoundingClientRect();
        const anim = node.getAnimations().map((a) => ({
          name: (a as CSSAnimation).animationName,
          currentTime: a.currentTime,
          progress: (a.effect as KeyframeEffect)?.getComputedTiming().progress,
        }));
        return { cls: node.className, op: s.opacity, vis: s.visibility, top: Math.round(r.top), h: Math.round(r.height), anim };
      });
      console.log(`  ${i} ${JSON.stringify(info)}`);
    }
  }
});
  await page.route('https://**/*', (route) => route.abort());
  for (const width of [360, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const data = await page.evaluate(() => {
      const box = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return {
          x: Math.round(r.x), right: Math.round(r.right), y: Math.round(r.y),
          w: Math.round(r.width), h: Math.round(r.height),
          display: s.display, vis: s.visibility, op: s.opacity, ff: s.fontFamily, fs: s.fontSize,
        };
      };
      const strip = document.querySelector('.market-strip');
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        container: box('.nav-container'),
        brand: box('.nav-brand'),
        brandText: box('.nav-brand .brand-text'),
        auth: box('.nav-auth'),
        toggle: box('.nav-toggle'),
        menu: box('.nav-menu'),
        tabs: box('.city-tabs'),
        stripH: strip ? Math.round(strip.getBoundingClientRect().height) : null,
        stripRows: strip ? Array.from(strip.children).map((c) => Math.round((c as HTMLElement).getBoundingClientRect().top)) : [],
        stripGap: strip ? getComputedStyle(strip).gap : null,
        cardImgs: Array.from(document.querySelectorAll('.property-image')).slice(0, 3).map((c) => Math.round(c.getBoundingClientRect().height)),
        cardTotals: Array.from(document.querySelectorAll('.property-card')).slice(0, 3).map((c) => Math.round(c.getBoundingClientRect().height)),
      };
    });
    console.log(`WIDTH ${width} :: ${JSON.stringify(data)}`);
    await page.locator('.navbar').screenshot({ path: `test-results/diag-nav-${width}.png` });
    await page.locator('.market-strip').screenshot({ path: `test-results/diag-strip-${width}.png` });
    await page.locator('.city-tabs').screenshot({ path: `test-results/diag-tabs-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.screenshot({ path: 'test-results/diag-mobile-full.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.screenshot({ path: 'test-results/diag-desktop-full.png', fullPage: true });
});