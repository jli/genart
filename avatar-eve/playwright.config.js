import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:8766',
    headless: true,
  },
  webServer: {
    command: 'python3 -m http.server 8766',
    url: 'http://localhost:8766',
    reuseExistingServer: true,
  },
});
