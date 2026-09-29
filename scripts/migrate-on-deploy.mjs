import { execSync } from "node:child_process";

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

if (!process.env.DIRECT_URL) {
  console.error(
    "DIRECT_URL is not set. Migrations need the session pooler connection (port 5432), " +
      "not the transaction pooler used at runtime.",
  );
  process.exit(1);
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });
