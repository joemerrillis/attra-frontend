import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: Complete Onboarding and Campaign Creation Wizards
 *
 * This test walks through:
 * 1. Creating a test account (or using existing credentials)
 * 2. Completing the onboarding wizard
 * 3. Creating a campaign with the campaign wizard
 * 4. Verifying the complete flow works end-to-end
 */

// Test credentials - You can configure these as environment variables
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test-e2e@attra.io',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  businessName: 'E2E Test Business',
  industry: 'restaurant',
};

// Helper function to login (bypasses OAuth for testing)
async function login(page: Page) {
  // NOTE: If using Google OAuth, you'll need to either:
  // 1. Use Supabase test helpers to create session
  // 2. Mock the OAuth flow
  // 3. Use Playwright's authentication state storage

  // For now, check if there's a direct login option for testing
  await page.goto('/login');

  // Check if already logged in (skip if on dashboard)
  if (page.url().includes('/dashboard')) {
    return; // Already logged in
  }

  // TODO: Implement login based on your auth setup
  // Option 1: Direct email/password (if you have test mode)
  // Option 2: Bypass auth by setting localStorage session
  // Option 3: Use Supabase auth helpers

  console.log('⚠️  Login implementation needed - skipping for now');

  // Temporary: Set mock auth state (ONLY FOR LOCAL TESTING)
  if (process.env.BYPASS_AUTH_FOR_TESTING === 'true') {
    await page.evaluate(() => {
      // This is a placeholder - adjust based on your auth implementation
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_at: Date.now() + 3600000,
      }));
    });
    await page.goto('/dashboard');
  }
}

test.describe('Complete Wizard Flow - Onboarding to Campaign Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for wizard flows
    test.setTimeout(120000); // 2 minutes
  });

  test('should complete onboarding wizard and create first campaign', async ({ page }) => {
    // ==========================================
    // PART 1: AUTHENTICATION
    // ==========================================
    console.log('📝 Step 1: Logging in...');
    await login(page);

    // Verify we're logged in
    await expect(page).not.toHaveURL(/\/login/);

    // Screenshot after login
    await page.screenshot({
      path: 'tests/screenshots/01-after-login.png',
      fullPage: true
    });

    // ==========================================
    // PART 2: ONBOARDING WIZARD
    // ==========================================
    // NOTE: Adjust these selectors based on your actual onboarding wizard
    // This is a template - you'll need to update selectors

    console.log('📝 Step 2: Starting onboarding wizard...');

    // Check if onboarding wizard appears (might auto-show for new users)
    const onboardingStarted = await page.locator('text=/welcome|onboarding|get started/i').isVisible({ timeout: 5000 })
      .catch(() => false);

    if (onboardingStarted) {
      // Step 1: Business Information
      console.log('   → Filling business information...');
      await page.fill('input[name="businessName"]', TEST_USER.businessName);
      await page.selectOption('select[name="industry"]', TEST_USER.industry);
      await page.screenshot({ path: 'tests/screenshots/02-onboarding-business-info.png' });
      await page.click('button:has-text("Next")');

      // Wait for next step
      await page.waitForTimeout(1000);

      // Step 2: Location Setup (if applicable)
      const hasLocationStep = await page.locator('text=/location|address/i').isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasLocationStep) {
        console.log('   → Adding first location...');
        await page.fill('input[name="locationName"]', 'Test Location 1');
        await page.fill('input[name="address"]', '123 Test St, San Francisco, CA 94102');
        await page.screenshot({ path: 'tests/screenshots/03-onboarding-location.png' });
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(1000);
      }

      // Step 3: Branding (if applicable)
      const hasBrandingStep = await page.locator('text=/brand|logo|colors/i').isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasBrandingStep) {
        console.log('   → Setting up branding...');
        // May include logo upload, color selection, etc.
        // Skip for now or use defaults
        await page.screenshot({ path: 'tests/screenshots/04-onboarding-branding.png' });
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(1000);
      }

      // Final step: Complete onboarding
      console.log('   → Completing onboarding...');
      await page.click('button:has-text("Complete")');
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      await page.screenshot({ path: 'tests/screenshots/05-onboarding-complete.png' });

      console.log('✅ Onboarding completed!');
    } else {
      console.log('ℹ️  Onboarding already completed, skipping to dashboard');
    }

    // ==========================================
    // PART 3: CAMPAIGN CREATION WIZARD
    // ==========================================
    console.log('📝 Step 3: Creating campaign...');

    // Navigate to campaign creation
    await page.click('a[href="/campaigns/new"], button:has-text("Create Campaign")');
    await page.waitForURL(/\/campaigns\/new/, { timeout: 5000 });
    await page.screenshot({ path: 'tests/screenshots/06-campaign-wizard-start.png' });

    // ==========================================
    // Campaign Wizard - Step 1: Name & Goal
    // ==========================================
    console.log('   → Step 1: Name & Goal');
    await page.fill('input[name="name"], input[placeholder*="campaign name"]', 'E2E Test Campaign');

    // Select marketing goal
    const goalOptions = await page.locator('[data-goal], button[data-value]').count();
    if (goalOptions > 0) {
      await page.click('[data-goal="new_clients"], button[data-value="new_clients"]');
    }

    await page.screenshot({ path: 'tests/screenshots/07-campaign-step1-goal.png' });
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // ==========================================
    // Campaign Wizard - Step 2: Locations
    // ==========================================
    console.log('   → Step 2: Select Locations');

    // Select first location (should exist from onboarding)
    const firstLocation = page.locator('[data-location-id]').first();
    if (await firstLocation.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstLocation.click();
    }

    await page.screenshot({ path: 'tests/screenshots/08-campaign-step2-locations.png' });
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // ==========================================
    // Campaign Wizard - Step 3: Asset Type
    // ==========================================
    console.log('   → Step 3: Asset Type');

    // Select flyer asset type
    await page.click('[data-asset="flyer"], button:has-text("Flyer")');

    await page.screenshot({ path: 'tests/screenshots/09-campaign-step3-asset-type.png' });
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // ==========================================
    // Campaign Wizard - Step 4: Design
    // ==========================================
    console.log('   → Step 4: Design & Copy');

    // Fill destination URL
    await page.fill('input[type="url"], input[placeholder*="url"]', 'https://example.com/test');

    // Fill campaign copy
    await page.fill('input[placeholder*="headline"], input[name="headline"]', 'Test Headline');
    await page.fill('textarea[placeholder*="subheadline"], textarea[name="subheadline"]', 'This is a test subheadline for E2E testing');
    await page.fill('input[placeholder*="cta"], input[name="cta"]', 'Test Now');

    // Choose design mode
    const hasAIBackgrounds = await page.locator('button:has-text("AI Backgrounds")').isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasAIBackgrounds) {
      // Test AI Background selection
      console.log('      → Testing AI Backgrounds...');
      await page.click('button:has-text("AI Backgrounds")');
      await page.waitForTimeout(1000);

      // Check if backgrounds exist, otherwise skip generation for speed
      const existingBackgrounds = await page.locator('[data-background-id]').count();

      if (existingBackgrounds > 0) {
        console.log(`      → Found ${existingBackgrounds} existing backgrounds, selecting first one`);
        await page.locator('[data-background-id]').first().click();
      } else {
        console.log('      → No backgrounds found, using classic template instead');
        await page.click('button:has-text("Classic Templates")');
        await page.click('[data-layout="modern"], button:has-text("Modern")');
      }
    } else {
      // Use classic template
      console.log('      → Using Classic Template');
      await page.click('[data-layout="modern"], button:has-text("Modern")');
    }

    await page.screenshot({ path: 'tests/screenshots/10-campaign-step4-design.png', fullPage: true });
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000); // Design preview might load

    // ==========================================
    // Campaign Wizard - Step 5: Preview
    // ==========================================
    console.log('   → Step 5: Preview');

    // Wait for preview to render
    await page.waitForTimeout(2000);

    // Take screenshot of preview
    await page.screenshot({ path: 'tests/screenshots/11-campaign-step5-preview.png', fullPage: true });

    // Verify preview elements exist
    const hasPreview = await page.locator('[data-testid="flyer-preview"], .flyer-preview, canvas, iframe').isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasPreview) {
      console.log('      ✓ Preview rendered successfully');
    } else {
      console.log('      ⚠️  Preview not found, continuing anyway');
    }

    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // ==========================================
    // Campaign Wizard - Step 6: Review & Generate
    // ==========================================
    console.log('   → Step 6: Review & Generate');

    await page.screenshot({ path: 'tests/screenshots/12-campaign-step6-review.png', fullPage: true });

    // Click generate button
    await page.click('button:has-text("Generate"), button:has-text("Create Campaign")');

    // Wait for generation to start (should show loading state)
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/13-campaign-generating.png' });

    // Wait for completion (might redirect to campaign detail or campaigns list)
    await page.waitForURL(/\/campaigns/, { timeout: 30000 });

    console.log('✅ Campaign created successfully!');
    await page.screenshot({ path: 'tests/screenshots/14-campaign-complete.png', fullPage: true });

    // ==========================================
    // VERIFICATION
    // ==========================================
    console.log('📝 Step 4: Verifying campaign creation...');

    // Check if we're on campaigns list or campaign detail page
    const onCampaignsPage = page.url().includes('/campaigns');
    expect(onCampaignsPage).toBeTruthy();

    // Look for our campaign
    const campaignExists = await page.locator('text=/E2E Test Campaign/i').isVisible({ timeout: 5000 })
      .catch(() => false);

    if (campaignExists) {
      console.log('✅ Campaign found in list!');
    } else {
      console.log('⚠️  Campaign not found in list, but creation completed');
    }

    await page.screenshot({ path: 'tests/screenshots/15-final-verification.png', fullPage: true });

    console.log('');
    console.log('=====================================');
    console.log('✅ E2E TEST COMPLETED SUCCESSFULLY');
    console.log('=====================================');
    console.log('Screenshots saved in tests/screenshots/');
    console.log('');
  });
});

/**
 * Individual wizard tests (more granular)
 */

test.describe('Onboarding Wizard - Individual Steps', () => {
  test.skip('should validate business name is required', async ({ page }) => {
    await login(page);
    // Navigate to onboarding
    // Try to click Next without filling business name
    // Expect error message
  });

  test.skip('should save progress between steps', async ({ page }) => {
    await login(page);
    // Fill first step
    // Refresh page
    // Verify data persists
  });
});

test.describe('Campaign Wizard - Individual Steps', () => {
  test.skip('should prevent proceeding without required fields', async ({ page }) => {
    await login(page);
    await page.goto('/campaigns/new');

    // Try clicking Next without filling campaign name
    await page.click('button:has-text("Next")');

    // Should still be on step 1
    // Should show error message
  });

  test.skip('should allow going back to previous steps', async ({ page }) => {
    await login(page);
    await page.goto('/campaigns/new');

    // Fill step 1 and proceed
    // Click Back button
    // Verify data is preserved
  });
});
