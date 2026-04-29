import { defineConfig, devices } from "@playwright/test";
import path from "path";

const port = Number(process.env.PLAYWRIGHT_PORT || 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const authDir = path.resolve("e2e/.auth");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/.*\.setup\.ts/, /.*\.auth\.spec\.ts/],
    },
    {
      name: "auth-user",
      dependencies: ["setup"],
      testMatch: /.*user\.auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(authDir, "user.json"),
      },
    },
    {
      name: "auth-teacher",
      dependencies: ["setup"],
      testMatch: /.*teacher\.auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(authDir, "teacher.json"),
      },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
