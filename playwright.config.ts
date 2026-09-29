import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  // Specs share one database, so they run in order.
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /responsive\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: isCI ? `npx next start -p ${PORT}` : `npx next dev -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
      },
});
