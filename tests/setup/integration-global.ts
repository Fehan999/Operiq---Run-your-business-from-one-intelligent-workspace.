import { execSync } from "node:child_process";

/**
 * Applies migrations to the test database once before the integration suite. The URL is
 * passed explicitly so it always wins over whatever .env.local points at.
 */
export default function setup() {
  const url =
    process.env.TEST_DATABASE_URL ?? "postgresql://operiq:operiq@localhost:5432/operiq_test";
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
