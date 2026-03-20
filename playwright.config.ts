import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 120000,

  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    actionTimeout: 60000,
    navigationTimeout: 90000,
  },

  projects: [
    {
      name: 'chromium-with-extension',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
