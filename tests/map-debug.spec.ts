import { test, expect } from '@playwright/test';

test('debug map loading', async ({ page }) => {
  // Listen for console errors
  const errors: string[] = [];
  const logs: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
    }
    // Capture our debug logs
    if (text.includes('🗺️') || text.includes('Map')) {
      logs.push(text);
    }
  });

  // Set up mock auth - bypass authentication
  await page.route('**/auth/v1/user', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { tenant_id: 'test-tenant' }
      })
    });
  });

  await page.addInitScript(() => {
    // Mock localStorage for auth
    localStorage.setItem('sb-localhost-auth-token', JSON.stringify({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      user: { id: 'test-user', email: 'test@example.com' }
    }));
  });

  // Navigate to map page
  console.log('Navigating to map page...');
  await page.goto('http://localhost:5174/map', { waitUntil: 'networkidle' });

  // Wait a bit to see what happens
  await page.waitForTimeout(5000);

  // Take a screenshot
  await page.screenshot({ path: 'map-debug.png', fullPage: true });

  // Check page content
  const bodyText = await page.textContent('body');
  console.log('Page contains "Loading":', bodyText?.includes('Loading'));
  console.log('Page contains "Contacts ready":', bodyText?.includes('Contacts ready'));

  // Log our debug messages
  console.log('\n=== Debug Logs ===');
  logs.forEach(log => console.log(log));

  // Log errors
  console.log('\n=== Console Errors ===');
  if (errors.length > 0) {
    errors.forEach(err => console.log(err));
  } else {
    console.log('No errors!');
  }

  // Check for error messages in UI
  const hasStackError = await page.locator('text=/Maximum call stack/i').count();
  console.log('\nStack overflow in UI:', hasStackError);

  // Check if Mapbox is visible
  const hasMapbox = await page.locator('.mapboxgl-map').count();
  console.log('Mapbox container found:', hasMapbox);
});
