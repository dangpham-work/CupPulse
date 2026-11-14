import { defineConfig, devices } from '@playwright/test';

/**
 * E2E (Task 5.2): chạy trên hệ thống đã khởi động, ví dụ `docker compose up --build` (web :3000, API :4000).
 *   E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test
 * Trên production dùng URL Vercel trong E2E_BASE_URL.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } }],
});
