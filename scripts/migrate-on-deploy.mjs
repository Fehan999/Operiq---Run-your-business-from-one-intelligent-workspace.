import { execSync } from "node:child_process";

import { inspectConnectionString } from "./lib/connection-string.mjs";

/*
 * Runs before `next build` on Vercel. Only production deploys apply migrations: preview
 * deployments share the same database and must never change its schema on their own.
 * A failed migration fails the build, so a broken schema change never goes live.
 */

const target = process.env.VERCEL_ENV;

if (target !== "production") {
  console.log(`Skipping database migrations for a ${target ?? "local"} build.`);
  process.exit(0);
}

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

// Show what the build actually received (password reduced to its length), so a wrong
// value in the Vercel settings is visible right here in the log.
let hasProblems = false;
for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  const { summary, problems } = inspectConnectionString(process.env[name]);
  console.log(`${name}: ${summary}`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  if (problems.length > 0) hasProblems = true;
}

if (hasProblems) {
  fail(
    "Fix the connection strings in Vercel, Settings, Environment Variables (Production), " +
      "then deploy the latest commit again.",
  );
}

try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} catch {
  fail(
    "Database migrations failed, so the deploy was stopped and the live site was left " +
      "untouched. For P1000 (authentication failed) the password in DIRECT_URL is wrong: " +
      "reset it in Supabase (Project Settings, Database), paste the new one into both " +
      "DATABASE_URL and DIRECT_URL on Vercel and redeploy. Run `npm run db:check` locally " +
      "with the same values to test them before deploying.",
  );
}
