import { defineConfig, devices } from '@playwright/test';

import { MOUNT_PREVIEW_URL } from './scripts/mountedSite.ts';

// The site's own dev port, kept in step with vite.config.ts.
const BASE_URL = `http://localhost:${process.env.PORT ?? 10620}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // The built site, not the dev server: `vite dev` fills every address with
      // the home page's head, so a title assertion there would test the client's
      // correction rather than the head a crawler is handed. `vite preview`
      // serves the one file per address the prerender wrote.
      command: 'npm run build && npm run preview',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 180_000,
    },
    {
      // The same build, laid out by the container's own entrypoint and served
      // under a path of a shared host. Every address the page computes is only
      // right here if it went through `withBase()`, and nothing on the site's
      // own host would ever say otherwise.
      command: 'npm run build-mount && npm run preview-mount',
      url: MOUNT_PREVIEW_URL,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 180_000,
    },
  ],
});
