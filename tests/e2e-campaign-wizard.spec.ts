import { test, expect } from '@playwright/test';
import { authenticateWithTestToken } from './helpers/auth';

test.describe('Campaign Wizard - Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate using backend test token
    await authenticateWithTestToken(page);
  });

  test('should create campaign with AI background and generate PDF', async ({ page }) => {
    // Step 1: Navigate to campaign creation
    await page.goto('/campaigns/new');
    await expect(page).toHaveURL('/campaigns/new');

    // Verify wizard loaded
    await expect(page.locator('h1, h2').filter({ hasText: /Campaign|Create/ })).toBeVisible();

    // Step 2: Fill out Campaign Details (Step 1)
    console.log('📝 Step 1: Campaign Details');

    const campaignName = `Test Campaign ${Date.now()}`;
    await page.fill('input[name="name"]', campaignName);
    await page.fill('input[name="destinationUrl"]', 'https://example.com/join');

    // Click Next button
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Step 3: Select Locations (Step 2)
    console.log('📍 Step 2: Select Locations');

    // Wait for locations to load
    await page.waitForSelector('text=Select Locations', { timeout: 5000 });

    // Select first location
    const firstLocation = page.locator('[data-testid="location-item"]').first();
    const locationCount = await firstLocation.count();

    if (locationCount > 0) {
      await firstLocation.click();
    } else {
      console.warn('⚠️  No locations found, trying alternative selectors...');
      // Try clicking any checkbox or card
      const anyLocation = page.locator('input[type="checkbox"], .location-card, button').first();
      if (await anyLocation.count() > 0) {
        await anyLocation.click();
      }
    }

    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Step 4: Design - Select AI Background (Step 3)
    console.log('🎨 Step 3: Design with AI Background');

    // Switch to AI Backgrounds tab
    await page.click('button:has-text("AI Backgrounds")');
    await page.waitForTimeout(500);

    // Wait for backgrounds to load
    await page.waitForSelector('.background-option, [data-testid="background-option"]', {
      timeout: 10000
    });

    // Select first AI background
    const firstBackground = page.locator('.background-option, [data-testid="background-option"]').first();
    await firstBackground.click();

    // Fill in copy fields
    await page.fill('input[name="headline"], textarea[name="headline"]', 'Join Our Community');
    await page.fill('input[name="subheadline"], textarea[name="subheadline"]', 'Together we can make a difference');
    await page.fill('input[name="cta"], textarea[name="cta"]', 'Scan to Join');

    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Step 5: Review & Generate (Step 4)
    console.log('✅ Step 4: Review & Generate');

    // Verify review page shows campaign details
    await expect(page.locator('text=' + campaignName)).toBeVisible();

    // Click Generate Assets button
    const generateButton = page.locator('button:has-text("Generate")');
    await generateButton.click();

    console.log('⏳ Waiting for PDF generation...');

    // Wait for generation to complete (should redirect to detail page)
    await page.waitForURL(/\/campaigns\/[a-f0-9-]+$/, { timeout: 30000 });

    console.log('✅ Redirected to campaign detail page');

    // Step 6: Verify Campaign Detail Page
    console.log('📄 Step 5: Verify Detail Page');

    // Should see campaign name
    await expect(page.locator('h1, h2').filter({ hasText: campaignName })).toBeVisible();

    // Should see Campaign Assets card
    await expect(page.locator('text=Campaign Assets')).toBeVisible();

    // Wait for PDF generation (polling happens every 5 seconds)
    console.log('⏳ Waiting for PDF to be ready...');

    // Wait for "Download PDF" button to appear (max 60 seconds)
    const downloadButton = page.locator('button:has-text("Download PDF"), a:has-text("Download PDF")');
    await downloadButton.waitFor({ state: 'visible', timeout: 60000 });

    console.log('✅ Download button appeared!');

    // Verify button is enabled
    await expect(downloadButton).toBeEnabled();

    // Get the download URL
    const downloadUrl = await downloadButton.getAttribute('href');
    console.log('📥 Download URL:', downloadUrl);

    // Verify URL points to Supabase storage
    expect(downloadUrl).toContain('.supabase.co/storage/v1/object/public/flyers/');
    expect(downloadUrl).toContain('.pdf');

    console.log('\n🎉 Campaign wizard test completed successfully!');
  });
});
