import { test, expect } from '@playwright/test';

/**
 * Smoke tests — verifies the app boots and the critical auth + public flows
 * behave correctly. Does NOT require seed data or authenticated admin user.
 *
 * Tests assume:
 *  - dev server reachable at baseURL (auto-starts via playwright.config.ts)
 *  - Supabase reachable (env vars set)
 *  - At minimum the build completes (no broken imports / runtime crashes)
 */

test.describe('Auth gates', () => {
  test('logged-out user is redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();
  });

  test('/login renders the auth form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('E-Mail')).toBeVisible();
    await expect(page.getByLabel('Passwort')).toBeVisible();
    await expect(page.getByRole('button', { name: /Anmelden/i })).toBeVisible();
  });

  test('login redirect preserves the ?next= param', async ({ page }) => {
    await page.goto('/dashboard/customers');
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fcustomers/);
  });

  test('protected API returns 401 without a session', async ({ request }) => {
    const res = await request.post('/api/ai/generate', {
      data: { inputText: 'test', clientName: 'X' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test('public API (track) accepts unauth POST with valid payload', async ({ request }) => {
    const res = await request.post('/api/track', {
      data: {
        dealroom_id: '00000000-0000-0000-0000-000000000000',
        event_type: 'page_view',
        session_id: 'smoke-test-session',
      },
      failOnStatusCode: false,
    });
    // 200 (recorded) or 400 (validation error for unknown dealroom).
    // Either way: NOT 401 — track is public.
    expect([200, 400, 404]).toContain(res.status());
  });
});

test.describe('Public dealroom', () => {
  test('unknown slug returns 404', async ({ page }) => {
    const response = await page.goto('/d/this-slug-definitely-does-not-exist-' + Date.now());
    expect(response?.status()).toBe(404);
  });
});

test.describe('Build hygiene', () => {
  test('manifest.json is served', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('name');
    expect(body).toHaveProperty('start_url');
  });

  test('login page has no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Filter out known-fine errors (e.g. favicon, third-party tracking blockers)
    const meaningful = errors.filter(
      e =>
        !/favicon/.test(e) &&
        !/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e),
    );
    expect(meaningful, `Console errors: ${meaningful.join('\n')}`).toHaveLength(0);
  });
});
