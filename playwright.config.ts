import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
const host = "e2e-host-secret-32-character-minimum-secure";
const scheduler = "e2e-scheduler-secret-32-character-minimum";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 393, height: 852 },
    trace: "retain-on-failure",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_EXECUTABLE_PATH ||
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://localhost:3100/api/health",
    reuseExistingServer: false,
    env: {
      HOST_SECRET: host,
      SCHEDULER_SECRET: scheduler,
      APP_ORIGIN: "http://localhost:3100",
      ALLOW_INSECURE_LOCAL: "1",
      DATABASE_URL: process.env.E2E_DATABASE_URL || "",
    },
  },
});
