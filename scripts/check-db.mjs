import { config as loadEnv } from "dotenv";
import pg from "pg";

import { explainConnectionError, inspectConnectionString } from "./lib/connection-string.mjs";

/*
 * `npm run db:check`: tries DATABASE_URL and DIRECT_URL the same way the app and the
 * migrations do, and says what is wrong with each. Values come from .env.local / .env,
 * or from the shell, which wins. The password is never printed.
 */

loadEnv({ path: [".env.local", ".env"], quiet: true });

let failed = false;

for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  const { url, summary, problems } = inspectConnectionString(process.env[name]);
  console.log(`\n${name}\n  ${summary}`);

  for (const problem of problems) console.log(`  ✗ ${problem}`);
  if (problems.length > 0) failed = true;
  if (!url) continue;

  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10_000 });
  const started = Date.now();

  try {
    await client.connect();
    const { rows } = await client.query("select current_user as user");
    console.log(`  ✓ Connected as ${rows[0].user} in ${Date.now() - started} ms`);
  } catch (error) {
    failed = true;
    console.log(`  ✗ ${error.code ? `${error.code}: ` : ""}${error.message}`);
    const advice = explainConnectionError(error);
    if (advice) console.log(`    ${advice}`);
  } finally {
    await client.end().catch(() => {});
  }
}

console.log(failed ? "\nSomething needs fixing, see above.\n" : "\nBoth connections work.\n");
process.exit(failed ? 1 : 0);
