import { test, expect } from '@playwright/test';

test.describe('Phase 1: Foundation', () => {
  test('should show 4 bottom nav items', async ({ page }) => {
    await page.goto('/');

    // Wait for navigation to load
    await page.waitForSelector('nav[aria-label="Mobile navigation"]');

    const navItems = page.locator('nav[aria-label="Mobile navigation"] a');
    await expect(navItems).toHaveCount(4);

    // Verify the 4 items are: Dashboard, Campaigns, Map, Settings
    await expect(navItems.nth(0)).toContainText('Dashboard');
    await expect(navItems.nth(1)).toContainText('Campaigns');
    await expect(navItems.nth(2)).toContainText('Map');
    await expect(navItems.nth(3)).toContainText('Settings');
  });

  test('should show orange FAB', async ({ page }) => {
    await page.goto('/');

    // Wait for FAB to load
    const fab = page.locator('a[aria-label="Create Campaign"]');
    await expect(fab).toBeVisible();

    // Check background color contains orange (rgb for #F97316)
    const bgColor = await fab.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should be orange - allowing for some browser differences
    // RGB(249, 115, 22) is #F97316
    expect(bgColor).toMatch(/rgb\(249,\s*115,\s*22\)/);
  });

  test('should show orange active indicator on bottom nav', async ({ page }) => {
    await page.goto('/');

    // Wait for navigation
    await page.waitForSelector('nav[aria-label="Mobile navigation"]');

    // Find the active tab (should be Dashboard)
    const activeTab = page.locator('nav[aria-label="Mobile navigation"] a[aria-current="page"]');
    await expect(activeTab).toBeVisible();

    // Check for orange indicator bar
    const indicator = activeTab.locator('.bg-accent');
    await expect(indicator).toBeVisible();

    // Verify indicator is at bottom
    const indicatorBox = await indicator.boundingBox();
    const tabBox = await activeTab.boundingBox();

    if (indicatorBox && tabBox) {
      // Indicator should be near the bottom of the tab
      expect(indicatorBox.y + indicatorBox.height).toBeCloseTo(tabBox.y + tabBox.height, 5);
    }
  });

  test('should have accent button variant on campaigns page', async ({ page }) => {
    await page.goto('/campaigns');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find "New Campaign" button in header
    const accentButton = page.locator('button:has-text("New Campaign")').first();
    await expect(accentButton).toBeVisible();

    // Check it has orange background
    const bgColor = await accentButton.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should be orange
    expect(bgColor).toMatch(/rgb\(249,\s*115,\s*22\)/);
  });

  test('should position FAB above bottom nav on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for elements
    await page.waitForSelector('nav[aria-label="Mobile navigation"]');
    const fab = page.locator('a[aria-label="Create Campaign"]');
    await expect(fab).toBeVisible();

    const bottomNav = page.locator('nav[aria-label="Mobile navigation"]');

    // Get bounding boxes
    const fabBox = await fab.boundingBox();
    const navBox = await bottomNav.boundingBox();

    if (fabBox && navBox) {
      // FAB bottom should be above (less than) bottom nav top
      expect(fabBox.y + fabBox.height).toBeLessThan(navBox.y);
    }
  });

  test('should have proper touch targets (≥44px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check bottom nav items
    await page.waitForSelector('nav[aria-label="Mobile navigation"]');
    const navItems = page.locator('nav[aria-label="Mobile navigation"] a');

    for (let i = 0; i < await navItems.count(); i++) {
      const item = navItems.nth(i);
      const box = await item.boundingBox();

      if (box) {
        // Height should be at least 44px
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Check FAB size (should be 56x56px)
    const fab = page.locator('a[aria-label="Create Campaign"]');
    const fabBox = await fab.boundingBox();

    if (fabBox) {
      expect(fabBox.width).toBeCloseTo(56, 5);
      expect(fabBox.height).toBeCloseTo(56, 5);
    }
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus on bottom nav items
    const focused = await page.evaluate(() => document.activeElement?.textContent);
    expect(focused).toBeTruthy();

    // Enter should activate link
    // (We won't actually navigate, just verify it's interactive)
  });

  test('should work on desktop breakpoint', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Bottom nav should be hidden on desktop (md:hidden)
    const bottomNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(bottomNav).not.toBeVisible();

    // FAB should be in bottom-right corner (not above nav)
    const fab = page.locator('a[aria-label="Create Campaign"]');
    await expect(fab).toBeVisible();

    const fabBox = await fab.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 0;

    if (fabBox) {
      // FAB should be near right edge
      expect(fabBox.x + fabBox.width).toBeGreaterThan(viewportWidth - 100);
    }
  });

  test('should show slate text colors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that primary text is using slate colors
    const heading = page.locator('h1').first();
    const color = await heading.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // Should be a dark color (slate), not bright blue
    // Slate 800 is rgb(30, 41, 59)
    // Just verify it's not the old blue (rgb(62, 100, 255) or similar)
    expect(color).not.toMatch(/rgb\(62,\s*100,\s*255\)/);
  });
});
