import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./browser-tests",
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:599",
    viewport: { width: 1440, height: 1000 },
    channel: process.env.REVERSE_SNAKE_BROWSER || undefined,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 599",
    url: "http://127.0.0.1:599",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
