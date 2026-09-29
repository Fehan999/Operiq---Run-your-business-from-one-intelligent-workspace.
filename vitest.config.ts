import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": `${root}src`,
      // `server-only` throws outside the React server runtime; tests run plain Node.
      "server-only": `${root}tests/stubs/server-only.ts`,
    },
  },
  test: {
    env: {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "operiq-test",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      LOG_LEVEL: "error",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["tests/components/**/*.test.tsx"],
          setupFiles: ["tests/setup/components.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/setup/integration-global.ts"],
          setupFiles: ["tests/setup/integration.ts"],
          // Every file shares one database, so run them one at a time.
          fileParallelism: false,
          env: {
            DATABASE_URL:
              process.env.TEST_DATABASE_URL ??
              "postgresql://operiq:operiq@localhost:5432/operiq_test",
          },
        },
      },
    ],
  },
});
