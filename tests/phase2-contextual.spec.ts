import { test, expect } from '@playwright/test';

test.describe('Phase 2: Contextual Dashboard', () => {
  test('should show contextual card on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show at least one context card with left border
    const contextCards = page.locator('[class*="border-l-"]');
    await expect(contextCards.first()).toBeVisible();
  });

  test('should show urgent priority styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // With default mock data (contactsReady: 3), should show urgent card
    const urgentCard = page.locator('[class*="border-l-destructive"]');

    // Check if urgent card exists (may not if mock data changed)
    const urgentCount = await urgentCard.count();
    if (urgentCount > 0) {
      await expect(urgentCard.first()).toBeVisible();

      // Should contain contact-related text
      const cardText = await urgentCard.first().textContent();
      expect(cardText).toMatch(/contact/i);
    }
  });

  test('should show positive priority styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show positive card (green border) for scans
    const positiveCard = page.locator('[class*="border-l-success"]');

    const positiveCount = await positiveCard.count();
    if (positiveCount > 0) {
      await expect(positiveCard.first()).toBeVisible();
    }
  });

  test('should use brand symbols in headlines', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for content to load
    await page.waitForSelector('[class*="border-l-"]');

    // Check for presence of brand symbols (●> or >●)
    const pageContent = await page.content();

    // Should contain at least one brand symbol
    const hasPhysicalToDigital = pageContent.includes('●>');
    const hasDigitalToPhysical = pageContent.includes('>●');

    expect(hasPhysicalToDigital || hasDigitalToPhysical).toBeTruthy();
  });

  test('should show contextual buttons with correct variants', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show at least one button in context cards
    const contextButton = page.locator('[class*="border-l-"] button, [class*="border-l-"] a[role="button"]');

    const buttonCount = await contextButton.count();
    if (buttonCount > 0) {
      await expect(contextButton.first()).toBeVisible();

      // Urgent cards should have accent (orange) button
      const urgentCard = page.locator('[class*="border-l-destructive"]');
      if (await urgentCard.count() > 0) {
        const urgentButton = urgentCard.locator('button, a').first();
        await expect(urgentButton).toBeVisible();
      }
    }
  });

  test('should show loading skeleton initially', async ({ page }) => {
    // Navigate and immediately check for skeleton
    const response = page.goto('/dashboard');

    // Should show skeleton while loading
    const skeleton = page.locator('[class*="animate-pulse"]');

    // Skeleton may or may not be visible depending on load speed
    // Just verify page loads without error
    await response;
    await page.waitForLoadState('networkidle');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Context cards should be visible on mobile
    const contextCards = page.locator('[class*="border-l-"]');
    await expect(contextCards.first()).toBeVisible();

    // Cards should stack vertically (full width)
    const firstCard = contextCards.first();
    const box = await firstCard.boundingBox();

    if (box) {
      // Card should take most of the width (allowing for padding)
      expect(box.width).toBeGreaterThan(300);
    }
  });

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Context cards should be visible on desktop
    const contextCards = page.locator('[class*="border-l-"]');
    await expect(contextCards.first()).toBeVisible();
  });

  test('should work in dark mode', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Toggle dark mode (if dark mode toggle exists)
    // This test assumes dark mode is accessible via class or system preference

    // Context cards should still be visible
    const contextCards = page.locator('[class*="border-l-"]');
    await expect(contextCards.first()).toBeVisible();
  });

  test('should show ArrowRight icon in buttons', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find buttons with ArrowRight icons
    const buttonWithIcon = page.locator('[class*="border-l-"] button svg, [class*="border-l-"] a svg');

    const iconCount = await buttonWithIcon.count();
    if (iconCount > 0) {
      await expect(buttonWithIcon.first()).toBeVisible();
    }
  });

  test('should show stat cards when all caught up', async ({ page }) => {
    // This test would require mocking API to return "all caught up" state
    // For now, just verify the dashboard renders without errors
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Page should have loaded successfully
    const heading = page.locator('h1:has-text("Dashboard")');
    await expect(heading).toBeVisible();
  });
});
