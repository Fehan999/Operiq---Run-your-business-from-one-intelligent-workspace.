import { createHash, randomBytes, randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import pg from "pg";

/*
 * End-to-end tests sign in by writing a session straight into the database, the same
 * row the app would create after a Firebase sign-in. That keeps the tests independent of
 * Google's servers without adding any test-only backdoor to the app itself.
 */

loadEnv({ path: [".env.local", ".env"], quiet: true });

const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString, max: 2 });

export const E2E_EMAIL_DOMAIN = "e2e.operiq.test";

export async function createUserWithSession(options: { name: string; verified?: boolean }) {
  const id = randomUUID();
  const email = `${options.name.toLowerCase().replace(/\s+/g, ".")}.${id.slice(0, 8)}@${E2E_EMAIL_DOMAIN}`;
  await pool.query(
    `INSERT INTO users (id, firebase_uid, email, name, email_verified_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, now(), now())`,
    [id, `e2e-${id}`, email, options.name, options.verified === false ? null : new Date()],
  );

  const token = randomBytes(32).toString("base64url");
  await pool.query(
    `INSERT INTO sessions (id, token_hash, user_id, expires_at, user_agent)
     VALUES ($1, $2, $3, now() + interval '1 day', 'playwright')`,
    [randomUUID(), createHash("sha256").update(token).digest("hex"), id],
  );

  return { id, email, token };
}

export async function createWorkspaceFor(
  userId: string,
  options: { name: string; role?: string; completed?: boolean },
) {
  const id = randomUUID();
  const slug = `e2e-${options.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id.slice(0, 6)}`;
  await pool.query(
    `INSERT INTO organizations (id, name, slug, industry, company_size, onboarding_step, onboarding_completed_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'agency', 'SIZE_2_10', $4, $5, now(), now())`,
    [
      id,
      options.name,
      slug,
      options.completed === false ? "BUSINESS" : "COMPLETED",
      options.completed === false ? null : new Date(),
    ],
  );
  await addMembership(id, userId, options.role ?? "OWNER");
  return { id, slug };
}

export async function addMembership(organizationId: string, userId: string, role: string) {
  await pool.query(
    `INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, now(), now())`,
    [randomUUID(), organizationId, userId, role],
  );
}

/** Removes everything earlier e2e runs created. Workspaces cascade to their audit trail. */
export async function cleanupE2eData() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL operiq.allow_audit_purge = 'on'");
    await client.query(
      `DELETE FROM organizations WHERE id IN (
         SELECT m.organization_id FROM organization_members m
         JOIN users u ON u.id = m.user_id WHERE u.email LIKE $1)`,
      [`%@${E2E_EMAIL_DOMAIN}`],
    );
    await client.query(`DELETE FROM users WHERE email LIKE $1`, [`%@${E2E_EMAIL_DOMAIN}`]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
