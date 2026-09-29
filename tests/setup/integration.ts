import { afterAll, beforeEach } from "vitest";

import { db } from "@/lib/db";

const TABLES = [
  "notifications",
  "activities",
  "audit_logs",
  "invitations",
  "organization_members",
  "sessions",
  "users",
  "organizations",
];

beforeEach(async () => {
  // TRUNCATE skips row-level triggers, so the append-only audit guard doesn't get in the way.
  await db.$executeRawUnsafe(`TRUNCATE ${TABLES.map((table) => `"${table}"`).join(", ")} CASCADE`);
});

afterAll(async () => {
  await db.$disconnect();
});
