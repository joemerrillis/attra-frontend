import type { Page } from '@playwright/test';

/**
 * Authenticates a Playwright page using the backend test token endpoint.
 *
 * This helper:
 * 1. Calls /api/dev/generate-token to get a real Supabase JWT
 * 2. Injects the session into localStorage (where Supabase client expects it)
 * 3. Reloads the page to pick up the session
 *
 * After calling this, the page will be authenticated as dev-test@attra.io
 * with tenant 00000000-0000-0000-0000-000000000000.
 *
 * @param page - Playwright page object
 * @example
 * ```typescript
 * import { authenticateWithTestToken } from './helpers/auth';
 *
 * test('create campaign', async ({ page }) => {
 *   await authenticateWithTestToken(page);
 *   await page.goto('/campaigns/new');
 *   // ... rest of test
 * });
 * ```
 */
export async function authenticateWithTestToken(page: Page) {
  const backendUrl = process.env.VITE_API_URL || 'http://localhost:8080';

  // Get token from backend
  const response = await fetch(`${backendUrl}/api/dev/generate-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  });

  if (!response.ok) {
    throw new Error(
      `Failed to generate test token: ${response.status} ${response.statusText}`
    );
  }

  const { access_token, user, expires_at } = await response.json();

  // Build session object matching Supabase session structure
  const session = {
    access_token,
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at,
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      app_metadata: {},
      user_metadata: {
        full_name: 'Dev Test User',
        tenant_id: user.tenant_id
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      role: 'authenticated'
    }
  };

  // Navigate to the app (needed to set localStorage)
  await page.goto('/');

  // Inject the session into localStorage
  await page.evaluate((sessionData) => {
    // Supabase stores session under this key format
    const key = `sb-${window.location.hostname}-auth-token`;
    localStorage.setItem(key, JSON.stringify(sessionData));
  }, session);

  // Reload to pick up the session
  await page.reload();

  // Wait for navigation to complete (should redirect to dashboard/campaigns/map)
  await page.waitForLoadState('networkidle');
}
