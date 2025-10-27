import { test, expect } from '@playwright/test';

test('Visual check - map page', async ({ page }) => {
  // Capture all console messages
  const logs: Array<{ type: string, text: string }> = [];

  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Just navigate and wait
  console.log('Opening map page...');
  await page.goto('http://localhost:5174/map');

  // Wait for any JS to execute
  await page.waitForTimeout(10000);

  // Take screenshot
  await page.screenshot({ path: 'map-visual.png', fullPage: true });

  // Print all console logs
  console.log('\n===== CONSOLE LOGS =====');
  logs.forEach(log => {
    console.log(`[${log.type}] ${log.text}`);
  });

  // Check for errors
  const errors = logs.filter(l => l.type === 'error');
  console.log(`\n===== SUMMARY =====`);
  console.log(`Total console messages: ${logs.length}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n===== ERRORS =====');
    errors.forEach(err => console.log(err.text));
  }

  // Check what's on the page
  const body = await page.textContent('body');
  console.log('\nPage contains:');
  console.log('  - "Loading": ', body?.includes('Loading'));
  console.log('  - "Contacts ready": ', body?.includes('Contacts ready'));
  console.log('  - "Welcome Back": ', body?.includes('Welcome Back'));
  console.log('  - "Maximum call stack": ', body?.includes('Maximum call stack'));

  // This test always passes - it's just for visual inspection
  expect(true).toBe(true);
});
