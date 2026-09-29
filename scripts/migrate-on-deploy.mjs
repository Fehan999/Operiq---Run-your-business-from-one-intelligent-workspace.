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

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  fail(
    "DIRECT_URL is not set. Migrations need the session pooler connection (port 5432), " +
      "not the transaction pooler used at runtime.",
  );
}

// Catch the usual copy-paste mistakes before Postgres answers with a vague auth error.
for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  const value = process.env[name] ?? "";

  if (/YOUR-PASSWORD/i.test(value)) {
    fail(
      `${name} still contains the [YOUR-PASSWORD] placeholder from the Supabase dashboard. ` +
        "Replace it with the real database password (without the square brackets) in " +
        "Vercel, Settings, Environment Variables, then redeploy.",
    );
  }

  try {
    new URL(value);
  } catch {
    fail(
      `${name} is not a valid connection string. This usually means the password contains ` +
        "characters such as # / ? that must be URL-encoded (# is %23, / is %2F, ? is %3F, " +
        "@ is %40). Resetting the database password to letters and digits avoids the problem.",
    );
  }
}

try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} catch {
  fail(
    "Database migrations failed, so the deploy was stopped and the live site was left " +
      "untouched. For P1000 (authentication failed) the password in DIRECT_URL is wrong: " +
      "reset it in Supabase (Project Settings, Database), paste the new one into both " +
      "DATABASE_URL and DIRECT_URL on Vercel and redeploy. The username must look like " +
      "postgres.<project-ref>.",
  );
}
