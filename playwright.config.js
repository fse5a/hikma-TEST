import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './frontend/tests',
  testMatch: '**/*.e2e.spec.js',
  timeout: 180_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...devices['Desktop Chrome'],
    locale: 'ar-EG',
    headless: true,
    launchOptions: process.env.HIKMA_CHROME ? {executablePath: process.env.HIKMA_CHROME, args: ['--no-sandbox']} : {}
  },
  webServer: {
    command: 'node scripts/dev-server.js',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});