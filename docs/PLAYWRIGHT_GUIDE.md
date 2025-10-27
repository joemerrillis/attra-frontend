# Playwright Guide for Frontend Claude

This guide explains how Frontend Claude uses Playwright for visual testing and verification of implemented features.

---

## 🎯 Purpose

Playwright enables Frontend Claude to:
- **See** the UI components being implemented
- **Verify** layouts, spacing, colors match specifications
- **Test** user interactions (clicks, forms, navigation)
- **Screenshot** different states for documentation
- **Catch** visual bugs before reporting completion

---

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests (headless)
pnpm run test

# Run tests with UI mode (interactive)
pnpm run test:ui

# Run tests in headed mode (see browser)
pnpm run test:headed

# Debug tests step-by-step
pnpm run test:debug

# View last test report
pnpm exec playwright show-report
```

### Installing Browsers

```bash
# Install Chromium (already done during setup)
pnpm run playwright:install
```

---

## 📝 Writing Tests for New Features

When implementing a feature from Researcher, create a test to verify it works:

### Example: Testing a New Form Component

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Profile Form', () => {
  test('form renders correctly', async ({ page }) => {
    // Navigate to the page
    await page.goto('/profile/edit');

    // Take screenshot of initial state
    await page.screenshot({
      path: 'tests/screenshots/profile-form-default.png',
      fullPage: true
    });

    // Verify form fields exist
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('form submission works', async ({ page }) => {
    await page.goto('/profile/edit');

    // Fill in form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');

    // Screenshot before submission
    await page.screenshot({
      path: 'tests/screenshots/profile-form-filled.png'
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();

    // Screenshot after submission
    await page.screenshot({
      path: 'tests/screenshots/profile-form-success.png'
    });
  });

  test('form shows validation errors', async ({ page }) => {
    await page.goto('/profile/edit');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Verify error messages appear
    await expect(page.locator('.error-message')).toBeVisible();

    // Screenshot error state
    await page.screenshot({
      path: 'tests/screenshots/profile-form-errors.png'
    });
  });
});
```

---

## 🖼️ Taking Screenshots

Screenshots are crucial for verifying implementations and including in responses to Researcher.

### Basic Screenshot

```typescript
await page.screenshot({ path: 'tests/screenshots/my-page.png' });
```

### Full Page Screenshot

```typescript
await page.screenshot({
  path: 'tests/screenshots/my-page-full.png',
  fullPage: true
});
```

### Element Screenshot

```typescript
const element = page.locator('.my-component');
await element.screenshot({ path: 'tests/screenshots/my-component.png' });
```

### Screenshot on Different Viewports

```typescript
// Mobile viewport
await page.setViewportSize({ width: 375, height: 667 });
await page.screenshot({ path: 'tests/screenshots/mobile.png' });

// Tablet viewport
await page.setViewportSize({ width: 768, height: 1024 });
await page.screenshot({ path: 'tests/screenshots/tablet.png' });

// Desktop viewport
await page.setViewportSize({ width: 1920, height: 1080 });
await page.screenshot({ path: 'tests/screenshots/desktop.png' });
```

---

## 🔍 Common Testing Patterns

### Testing API Integration

```typescript
test('loads data from API', async ({ page }) => {
  // Intercept API call
  await page.route('/api/users/*', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ id: 1, name: 'Test User' })
    });
  });

  await page.goto('/users/1');

  // Verify data is displayed
  await expect(page.locator('h1')).toContainText('Test User');

  await page.screenshot({ path: 'tests/screenshots/user-loaded.png' });
});
```

### Testing Error States

```typescript
test('shows error when API fails', async ({ page }) => {
  // Mock API error
  await page.route('/api/users/*', route => {
    route.fulfill({ status: 500 });
  });

  await page.goto('/users/1');

  // Verify error message
  await expect(page.locator('.error-message')).toContainText('Failed to load user');

  await page.screenshot({ path: 'tests/screenshots/user-error.png' });
});
```

### Testing Loading States

```typescript
test('shows loading spinner', async ({ page }) => {
  // Delay API response
  await page.route('/api/users/*', async route => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    route.fulfill({
      status: 200,
      body: JSON.stringify({ id: 1, name: 'Test User' })
    });
  });

  const loadingPromise = page.goto('/users/1');

  // Screenshot loading state
  await expect(page.locator('.loading-spinner')).toBeVisible();
  await page.screenshot({ path: 'tests/screenshots/user-loading.png' });

  await loadingPromise;

  // Screenshot loaded state
  await page.screenshot({ path: 'tests/screenshots/user-loaded.png' });
});
```

### Testing Forms with Validation

```typescript
test('validates email format', async ({ page }) => {
  await page.goto('/signup');

  // Enter invalid email
  await page.fill('input[name="email"]', 'invalid-email');
  await page.click('button[type="submit"]');

  // Verify validation error
  await expect(page.locator('.field-error')).toContainText('Invalid email format');

  await page.screenshot({ path: 'tests/screenshots/email-validation.png' });
});
```

---

## 📋 Workflow for Implementing Features

### Step 1: Read Task from Researcher

```bash
cat communication/researcher/inbox/LATEST_MESSAGE.json
```

### Step 2: Implement the Feature

Build the components, integrate APIs, etc.

### Step 3: Write Playwright Test

Create a test in `tests/` that:
- Navigates to the new feature
- Interacts with it (click, type, submit)
- Takes screenshots of different states
- Verifies expected behavior

### Step 4: Run Tests

```bash
pnpm run test
```

### Step 5: Review Screenshots

Check `tests/screenshots/` for visual verification.

### Step 6: Include in Response to Researcher

In your response JSON, include:
- Links to test files
- Paths to screenshots
- Description of what was tested

Example response snippet:
```json
{
  "body": {
    "content": "## Implementation Complete\n\n### Testing\nCreated Playwright tests in `tests/user-profile.spec.ts:1-50`\n\n**Test Results:**\n- ✅ Form renders correctly\n- ✅ Form submission works\n- ✅ Validation errors display properly\n\n**Screenshots:**\n- Default state: tests/screenshots/profile-form-default.png\n- Filled state: tests/screenshots/profile-form-filled.png\n- Error state: tests/screenshots/profile-form-errors.png\n- Success state: tests/screenshots/profile-form-success.png"
  }
}
```

---

## 🎨 Visual Regression Testing

When Researcher specifies exact UI requirements:

```typescript
test('matches design specifications', async ({ page }) => {
  await page.goto('/my-component');

  // Take baseline screenshot
  await expect(page).toHaveScreenshot('my-component-baseline.png');
});
```

On subsequent runs, Playwright will compare against the baseline and flag differences.

---

## 🔧 Configuration

The Playwright configuration is in `playwright.config.ts`:

- **Base URL:** `http://localhost:5173` (Vite dev server)
- **Browser:** Chromium (can add Firefox, WebKit)
- **Screenshots:** Taken on failure automatically
- **Videos:** Recorded on failure
- **Traces:** Collected on retry

---

## 📚 Best Practices for Frontend Claude

### 1. Test Every New Feature

Before marking a task complete, write at least one test that:
- Navigates to the feature
- Takes a screenshot
- Verifies it works as expected

### 2. Screenshot All States

Capture screenshots for:
- Default/initial state
- Loading state
- Success state
- Error states (400, 404, 500, etc.)
- Empty states (no data)
- Filled/populated states

### 3. Test Error Handling

Mock API failures and verify:
- Error messages display correctly
- UI doesn't break
- User can recover from errors

### 4. Use Descriptive Test Names

```typescript
// ❌ Bad
test('test 1', async ({ page }) => { ... });

// ✅ Good
test('user can submit profile form with valid data', async ({ page }) => { ... });
```

### 5. Clean Up Screenshots

Store screenshots in `tests/screenshots/` with descriptive names:
- `feature-name-state.png`
- `user-profile-form-default.png`
- `campaign-list-empty.png`

### 6. Include Tests in Git (But Not Screenshots)

- ✅ Commit: `tests/**/*.spec.ts`
- ❌ Don't commit: `tests/screenshots/` (in `.gitignore`)
- ❌ Don't commit: `test-results/`, `playwright-report/`

---

## 🚨 Troubleshooting

### Dev Server Not Starting

If tests fail because server won't start:

```bash
# Manually start dev server first
pnpm run dev

# In another terminal, run tests with existing server
pnpm run test
```

### Browser Not Installed

```bash
pnpm run playwright:install
```

### Test Timeout

Increase timeout in `playwright.config.ts`:

```typescript
timeout: 60 * 1000, // 60 seconds
```

---

## 📖 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Visual Comparisons](https://playwright.dev/docs/test-snapshots)

---

## ✨ Summary

Playwright gives Frontend Claude the ability to:
- **See** what's being built (screenshots)
- **Verify** it works (automated tests)
- **Prove** it matches specs (visual evidence)
- **Catch** bugs early (before reporting to Researcher)

This makes Frontend Claude more autonomous, thorough, and reliable! 🚀
