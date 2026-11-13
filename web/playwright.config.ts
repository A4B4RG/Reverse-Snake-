import { defineConfig } from "@playwright/test";

// Unix CI runs without permission to bind privileged ports below 1024.
const port = process.env.CI ? 1599 : 599;

export default defineConfig({
  testDir: "./browser-tests",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: process.env.REVERSE_SNAKE_BASE_URL || `http://127.0.0.1:${port}`,
    viewport: { width: 1440, height: 1000 },
    channel: process.env.REVERSE_SNAKE_BROWSER || undefined,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: process.env.REVERSE_SNAKE_BASE_URL ? undefined : {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
