import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run db:migrate && npm run dev:netlify -- --port 8888',
    url: 'http://127.0.0.1:8888',
    reuseExistingServer: true
  },
  use: {
    baseURL: 'http://127.0.0.1:8888',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ]
})
