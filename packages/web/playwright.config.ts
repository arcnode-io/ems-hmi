import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE } from './tests/global-setup';

export default defineConfig({
  testDir: './tests',
  // Reason: one shared backend — LOTO state and dispatch on the same BESS
  // would race across workers.
  fullyParallel: false,
  globalSetup: './tests/global-setup.ts',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI !== undefined ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    storageState: STORAGE_STATE,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});