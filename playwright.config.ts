import { defineConfig, devices } from "@playwright/test";

const TEST_AUTH_SECRET =
  process.env.AUTH_SECRET ??
  "test-secret-insecure-dont-use-in-production-XXXXXXXXXXXXXXXXXXXX";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    storageState: "tests/e2e/.auth/session.json",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { storageState: { cookies: [], origins: [] } },
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /(smoke|dashboard|habits)\.spec\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "guest-chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: /auth-guest\.spec\.ts/,
    },
    {
      name: "guest-mobile",
      use: {
        ...devices["Pixel 7"],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: /auth-guest\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /(smoke|dashboard|habits)\.spec\.ts/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      AUTH_SECRET: TEST_AUTH_SECRET,
      AUTH_URL: "http://localhost:3100",
      OWNER_EMAIL: "owner@example.com",
      ENABLE_TEST_SIGNIN: "1",
    },
  },
});
