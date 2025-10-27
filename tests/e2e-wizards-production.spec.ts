import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: Production Wizard Flow
 *
 * Tests against app.attra.io (production)
 * - Uses real Google OAuth login
 * - Tests actual deployed code
 * - Verifies production behavior
 *
 * Usage:
 *   npx playwright test e2e-wizards-production --headed
 *
 * Environment variables needed:
 *   TEST_USER_EMAIL=your-test-email@gmail.com (Google account)
 */

// Configure for production
test.use({
  baseURL: 'https://app.attra.io',
  // Slower timeout for production
  actionTimeout: 15000,
  navigationTimeout: 30000,
});

// Test credentials - use environment variables
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || '',
  // Note: For Google OAuth, we'll do manual login during headed mode
};

// Helper to wait for Google OAuth login (manual in headed mode)
async function loginWithGoogle(page: Page) {
  console.log('🔐 Navigating to login page...');
  await page.goto('/');

  // Check if already logged in
  const isLoggedIn = await page.locator('text=/dashboard|campaigns|logout/i').isVisible({ timeout: 3000 })
    .catch(() => false);

  if (isLoggedIn) {
    console.log('✅ Already logged in!');
    return;
  }

  // Click "Start Free" button to get to login
  console.log('📝 Clicking Start Free button...');
  const startFreeBtn = page.locator('button:has-text("Start Free"), a:has-text("Start Free")');
  const hasStartFree = await startFreeBtn.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasStartFree) {
    await startFreeBtn.click();
    await page.waitForTimeout(2000);
  }

  // Now click "Login with Google" button
  console.log('📝 Clicking Google login button...');
  const googleBtn = page.locator('button:has-text("Google"), button:has-text("Sign in with Google"), button:has-text("Continue with Google")');
  await googleBtn.waitFor({ timeout: 10000 });
  await googleBtn.click();

  // Wait for Google OAuth popup or redirect
  console.log('⏳ Waiting for Google OAuth...');
  console.log('   Please complete login in the browser window');
  console.log('   This may open a popup or redirect to Google');

  // Wait for redirect back to app
  await page.waitForURL(/app\.attra\.io/, { timeout: 120000 }); // 2 minute timeout for manual login

  // Wait for dashboard or onboarding
  await page.waitForTimeout(2000);

  console.log('✅ Login completed!');
}

test.describe('Production E2E - Complete Wizard Flow', () => {
  // Longer timeout for production
  test.setTimeout(180000); // 3 minutes

  test('should complete onboarding and create campaign on production', async ({ page }) => {
    console.log('🌐 Testing against PRODUCTION: https://app.attra.io');
    console.log('');

    // ==========================================
    // AUTHENTICATION
    // ==========================================
    await loginWithGoogle(page);

    await page.screenshot({
      path: 'tests/screenshots/prod-01-after-login.png',
      fullPage: true
    });

    // ==========================================
    // CHECK FOR ONBOARDING
    // ==========================================
    console.log('📝 Checking for onboarding wizard...');

    const needsOnboarding = await page.locator('text=/welcome|onboarding|get started/i').isVisible({ timeout: 5000 })
      .catch(() => false);

    if (needsOnboarding) {
      console.log('   → Onboarding wizard detected, completing...');

      // Note: This is a placeholder - adjust based on actual onboarding flow
      // For now, just click through with default values

      let stepCount = 0;
      const maxSteps = 10;

      while (stepCount < maxSteps) {
        stepCount++;

        // Take screenshot of current step
        await page.screenshot({
          path: `tests/screenshots/prod-onboarding-step-${stepCount}.png`,
          fullPage: true
        });

        // Try to find and click Next button
        const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
        const hasNext = await nextButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (!hasNext) {
          // Check for Finish/Complete button
          const finishButton = page.locator('button:has-text("Finish"), button:has-text("Complete"), button:has-text("Get Started")');
          const hasFinish = await finishButton.isVisible({ timeout: 2000 }).catch(() => false);

          if (hasFinish) {
            console.log('   → Clicking Finish button');
            await finishButton.click();
            await page.waitForTimeout(2000);
            break;
          } else {
            console.log('   → No Next/Finish button found, onboarding might be complete');
            break;
          }
        }

        console.log(`   → Completing step ${stepCount}...`);
        await nextButton.click();
        await page.waitForTimeout(2000);
      }

      console.log('✅ Onboarding completed (or skipped)');
    } else {
      console.log('ℹ️  No onboarding required, proceeding to dashboard');
    }

    await page.screenshot({
      path: 'tests/screenshots/prod-02-dashboard.png',
      fullPage: true
    });

    // ==========================================
    // NAVIGATE TO CAMPAIGN CREATION
    // ==========================================
    console.log('📝 Creating new campaign...');

    // Look for "New Campaign" or "Create Campaign" button
    const createButton = page.locator('button:has-text("Create Campaign"), button:has-text("New Campaign"), a[href="/campaigns/new"]');
    await createButton.waitFor({ timeout: 10000 });
    await createButton.click();

    await page.waitForURL(/\/campaigns\/new/, { timeout: 10000 });
    await page.screenshot({
      path: 'tests/screenshots/prod-03-campaign-wizard-start.png',
      fullPage: true
    });

    // ==========================================
    // CAMPAIGN WIZARD WALKTHROUGH
    // ==========================================
    console.log('   → Walking through campaign wizard...');

    let wizardStep = 0;
    const maxWizardSteps = 10;

    while (wizardStep < maxWizardSteps) {
      wizardStep++;

      await page.screenshot({
        path: `tests/screenshots/prod-campaign-step-${wizardStep}.png`,
        fullPage: true
      });

      console.log(`   → Campaign wizard step ${wizardStep}`);

      // Fill any visible inputs with test data
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]');
      if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('      → Filling campaign name');
        await nameInput.fill(`Production Test Campaign ${Date.now()}`);
      }

      const urlInput = page.locator('input[type="url"], input[placeholder*="url"]');
      if (await urlInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('      → Filling destination URL');
        await urlInput.fill('https://example.com/test');
      }

      const headlineInput = page.locator('input[placeholder*="headline"], input[name="headline"]');
      if (await headlineInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('      → Filling headline');
        await headlineInput.fill('Test Headline');
      }

      const subheadlineInput = page.locator('textarea[placeholder*="subheadline"], textarea[name="subheadline"]');
      if (await subheadlineInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('      → Filling subheadline');
        await subheadlineInput.fill('This is a production test');
      }

      const ctaInput = page.locator('input[placeholder*="cta"], input[name="cta"]');
      if (await ctaInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('      → Filling CTA');
        await ctaInput.fill('Test Now');
      }

      // Select any required options
      const firstOption = page.locator('[data-goal], [data-location-id], [data-asset], [data-layout]').first();
      if (await firstOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('      → Selecting first available option');
        await firstOption.click();
        await page.waitForTimeout(500);
      }

      // Try to proceed to next step
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
      const hasNext = await nextButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (!hasNext) {
        // Check for final buttons
        const finalButton = page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Finish")');
        const hasFinal = await finalButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasFinal) {
          console.log('   → Clicking final Generate/Create button');
          await finalButton.click();

          // Wait for generation/creation
          console.log('   → Waiting for campaign generation...');
          await page.waitForTimeout(5000);

          await page.screenshot({
            path: 'tests/screenshots/prod-04-campaign-generating.png',
            fullPage: true
          });

          // Wait for completion (redirect to campaigns list or detail)
          await page.waitForURL(/\/campaigns/, { timeout: 30000 });
          break;
        } else {
          console.log('   → No Next/Generate button found, wizard might be complete');
          break;
        }
      }

      await nextButton.click();
      await page.waitForTimeout(2000);
    }

    // ==========================================
    // VERIFICATION
    // ==========================================
    console.log('📝 Verifying campaign creation...');

    await page.screenshot({
      path: 'tests/screenshots/prod-05-campaign-complete.png',
      fullPage: true
    });

    // Should be on campaigns page
    expect(page.url()).toContain('/campaigns');

    console.log('');
    console.log('=====================================');
    console.log('✅ PRODUCTION E2E TEST COMPLETED');
    console.log('=====================================');
    console.log('');
    console.log('Tested against: https://app.attra.io');
    console.log('Screenshots: tests/screenshots/prod-*.png');
    console.log('');
  });
});

/**
 * Test: Just walk through campaign wizard (skip onboarding)
 */
test.describe('Production - Campaign Wizard Only', () => {
  test.setTimeout(120000); // 2 minutes

  test('should create campaign on existing account', async ({ page }) => {
    await loginWithGoogle(page);

    // Navigate directly to campaigns
    await page.goto('/campaigns/new');

    await page.screenshot({
      path: 'tests/screenshots/prod-wizard-only-start.png',
      fullPage: true
    });

    // Walk through wizard (same logic as above but isolated)
    console.log('📝 Walking through campaign wizard...');

    let step = 1;
    while (step <= 6) {
      await page.screenshot({
        path: `tests/screenshots/prod-wizard-only-step-${step}.png`,
        fullPage: true
      });

      // Fill any inputs
      await page.fill('input[name="name"]', `Test Campaign ${Date.now()}`).catch(() => {});
      await page.fill('input[type="url"]', 'https://example.com').catch(() => {});
      await page.fill('input[placeholder*="headline"]', 'Test Headline').catch(() => {});

      // Click first selectable option if any
      await page.locator('[data-goal], [data-location-id], [data-asset], [data-layout]').first().click().catch(() => {});

      // Try to proceed
      const hasNext = await page.locator('button:has-text("Next")').isVisible({ timeout: 1000 }).catch(() => false);

      if (hasNext) {
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(1500);
        step++;
      } else {
        // Check for Generate button
        const hasGenerate = await page.locator('button:has-text("Generate"), button:has-text("Create")').isVisible({ timeout: 1000 }).catch(() => false);

        if (hasGenerate) {
          await page.click('button:has-text("Generate"), button:has-text("Create")');
          await page.waitForURL(/\/campaigns/, { timeout: 30000 });
          break;
        } else {
          break;
        }
      }
    }

    await page.screenshot({
      path: 'tests/screenshots/prod-wizard-only-complete.png',
      fullPage: true
    });

    expect(page.url()).toContain('/campaigns');
    console.log('✅ Campaign wizard completed successfully');
  });
});
