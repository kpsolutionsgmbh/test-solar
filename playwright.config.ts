import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Dealroom smoke tests.
 *
 * Run:
 *   npm run test:e2e            # all tests against http://localhost:3000
 *   npm run test:e2e -- --ui    # interactive UI
 *
 * Tests assume a dev server is reachable at BASE_URL. The webServer block
 * auto-starts `npm run dev` if nothing is already listening on port 3000.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
