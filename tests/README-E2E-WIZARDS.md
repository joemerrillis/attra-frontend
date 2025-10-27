# E2E Wizard Tests

Comprehensive end-to-end tests for Onboarding and Campaign Creation wizards.

## Test Files

### 1. `e2e-wizards.spec.ts` - Local Development Tests
- Tests against `localhost:5173`
- Uses mock/bypass authentication
- Fast iteration for development

### 2. `e2e-wizards-production.spec.ts` - Production Tests ⭐
- Tests against `https://app.attra.io`
- Uses real Google OAuth login
- Validates actual production behavior

## Running Tests

### Quick Start (Production Tests)

```bash
# Run production tests in headed mode (you'll see the browser)
npx playwright test e2e-wizards-production --headed

# Run specific test
npx playwright test e2e-wizards-production -g "complete onboarding"
```

### Local Development Tests

```bash
# Ensure dev server is running
pnpm dev

# Run local tests
npx playwright test e2e-wizards
```

### All Tests

```bash
# Run all wizard tests
npx playwright test e2e-wizards

# Run with UI (interactive mode)
npx playwright test --ui

# Debug mode
npx playwright test e2e-wizards-production --headed --debug
```

## Authentication Setup

### For Production Tests

**Method 1: Manual Login (Recommended)**
1. Run test in headed mode: `npx playwright test e2e-wizards-production --headed`
2. When browser opens, manually complete Google OAuth login
3. Test will continue automatically after login

**Method 2: Saved Authentication State**
1. Run once manually to login
2. Playwright will save authentication state
3. Subsequent runs will reuse the session

### For Local Tests

**Option 1: Bypass Auth (Testing Only)**
```bash
# Set environment variable
BYPASS_AUTH_FOR_TESTING=true npx playwright test e2e-wizards
```

**Option 2: Use Test Credentials**
```bash
# Set test user credentials
TEST_USER_EMAIL=test@example.com TEST_USER_PASSWORD=password123 npx playwright test
```

## What Gets Tested

### Onboarding Wizard
1. ✅ Business information (name, industry)
2. ✅ First location setup
3. ✅ Branding configuration
4. ✅ Completion and redirect to dashboard

### Campaign Creation Wizard
1. ✅ Step 1: Name & Goal selection
2. ✅ Step 2: Location selection
3. ✅ Step 3: Asset type (flyer, door hanger, etc.)
4. ✅ Step 4: Design & Copy
   - Destination URL
   - Headline, subheadline, CTA
   - AI backgrounds vs classic templates
5. ✅ Step 5: Preview rendering
6. ✅ Step 6: Review & Generate
7. ✅ Campaign appears in campaigns list

## Screenshots

All tests capture screenshots at each step:

```
tests/screenshots/
  ├── prod-01-after-login.png
  ├── prod-onboarding-step-1.png
  ├── prod-onboarding-step-2.png
  ├── prod-03-campaign-wizard-start.png
  ├── prod-campaign-step-1.png
  ├── prod-campaign-step-2.png
  ├── ...
  └── prod-05-campaign-complete.png
```

Review screenshots to see exactly what happened during the test.

## Test Configuration

### Timeouts

- **Local tests:** 30 seconds per action
- **Production tests:** 15 seconds per action, 30 seconds for navigation
- **Overall test timeout:** 2-3 minutes

### Selectors

Tests use flexible selectors to adapt to UI changes:
- Text-based: `button:has-text("Next")`
- Data attributes: `[data-goal], [data-location-id]`
- Placeholders: `input[placeholder*="headline"]`

## Debugging Failed Tests

### 1. Check Screenshots

```bash
# Screenshots are in:
tests/screenshots/

# Open the last screenshot to see where test failed
```

### 2. Run in Debug Mode

```bash
npx playwright test e2e-wizards-production --headed --debug
```

This opens Playwright Inspector where you can:
- Step through the test
- Pause and inspect page
- Edit selectors on the fly

### 3. Check Console Output

Test prints detailed logs:
```
🔐 Navigating to login page...
✅ Already logged in!
📝 Checking for onboarding wizard...
   → Onboarding wizard detected, completing...
   → Completing step 1...
```

### 4. Slow Down Execution

```bash
# Add --slow-mo flag (milliseconds between actions)
npx playwright test e2e-wizards-production --headed --slow-mo=1000
```

## Common Issues

### Issue: "Login timeout"

**Solution:** Increase timeout or manually complete OAuth faster

```typescript
// In test file, increase timeout:
await page.waitForURL(/app\.attra\.io/, { timeout: 180000 }); // 3 minutes
```

### Issue: "Element not found"

**Cause:** Selector doesn't match actual HTML

**Solution:**
1. Run test with `--headed` to see what's on page
2. Use Playwright Inspector to find correct selector
3. Update test with correct selector

### Issue: "Test passes locally but fails in CI"

**Cause:** Timing differences, missing authentication

**Solution:**
- Add explicit waits: `await page.waitForTimeout(2000)`
- Use `waitForSelector` instead of immediate clicks
- Ensure authentication state is saved

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test e2e-wizards
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-screenshots
          path: tests/screenshots/
```

## Best Practices

### 1. Use Headed Mode During Development

```bash
npx playwright test --headed
```

See exactly what's happening in the browser.

### 2. Take Screenshots Frequently

Already implemented in tests - every step captures a screenshot.

### 3. Add Console Logs

Tests include verbose logging - watch the console to track progress.

### 4. Handle Dynamic Content

Tests use flexible selectors and timeouts to handle loading states.

### 5. Clean Up Test Data

After running tests, you may want to delete test campaigns:
- Log into production
- Navigate to campaigns
- Delete campaigns starting with "Production Test Campaign"

## Updating Tests

### When UI Changes

1. Run test with `--headed` to see failure
2. Use Playwright Inspector to find new selector
3. Update test file with new selector
4. Run again to verify

### Adding New Steps

```typescript
// Add after existing steps:
console.log('   → Step 7: New Feature');
await page.click('button:has-text("New Button")');
await page.screenshot({ path: 'tests/screenshots/prod-campaign-step-7.png' });
```

### Skip Tests Temporarily

```typescript
test.skip('should do something', async ({ page }) => {
  // Test code
});
```

## Support

### View Test Report

```bash
npx playwright show-report
```

Opens HTML report with:
- Test results
- Screenshots
- Traces
- Error details

### Generate New Tests

Use Playwright Codegen to record interactions:

```bash
npx playwright codegen https://app.attra.io
```

This opens a browser and records your clicks, which you can copy into tests.

---

## Quick Reference

```bash
# Production tests (recommended)
npx playwright test e2e-wizards-production --headed

# Local tests
npx playwright test e2e-wizards

# Debug mode
npx playwright test --headed --debug

# Slow motion
npx playwright test --headed --slow-mo=1000

# View report
npx playwright show-report

# Record new tests
npx playwright codegen https://app.attra.io
```
