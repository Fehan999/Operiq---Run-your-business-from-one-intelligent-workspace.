# Engineering decisions

Short records of the choices that shape the codebase, and why they were made.

### 1. A modular monolith on Next.js

**Decision:** one Next.js app with domain modules, Server Components and Server Actions.
**Why:** a small team (or one engineer) ships faster with one deployable, one database and
end-to-end types. Modules have their own schemas, services and policies, so extracting one into
a separate service later is mechanical. Microservices would add network failure modes and
operational cost without a real scaling need yet.

### 2. Firebase for identity, Postgres sessions for access

**Decision:** Firebase Auth handles passwords, Google sign-in, verification and reset emails.
The app verifies the ID token once and issues its own database-backed session.
**Why:** Firebase gives a free, well-audited auth stack without building password storage and
email delivery. Owning the session keeps revocation instant, lets us list devices, and means
authorization never depends on client-side Firebase state. Verifying tokens with `jose` avoids
storing a Firebase service account key.

### 3. PostgreSQL and Prisma, not a document store

**Decision:** relational schema with foreign keys, unique constraints and targeted indexes.
**Why:** business data is highly relational (customers, deals, invoices, payments, projects).
Constraints keep data correct under concurrency, and Postgres extensions (`pgvector`) cover the
upcoming RAG work without adding another database. Prisma 7 with the `pg` driver adapter needs
no native engine binary and works with poolers like Supabase's.

### 4. URL-based workspaces

**Decision:** `/w/<slug>/...` instead of a "current workspace" cookie.
**Why:** each tab is explicit about which tenant it's working in, links are shareable, and a
stale cookie can never cause a write to the wrong workspace.

### 5. Roles defined in code

**Decision:** a fixed role to permission map with pure policy functions.
**Why:** reviewable in one file, zero query cost, exhaustively unit tested. It can be extended
with stored per-workspace grants for custom roles without touching call sites.

### 6. Audit log enforced by the database

**Decision:** a trigger rejects `UPDATE`/`DELETE` on `audit_logs`, with an explicit per-transaction
escape hatch for deleting a whole workspace.
**Why:** an audit trail that application code can quietly rewrite isn't much of an audit trail.
Pushing the rule into Postgres protects it from bugs and from anyone with only app-level access.

### 7. Supabase Storage for files

**Decision:** images go to a Supabase Storage bucket through server actions.
**Why:** S3-compatible, generous free tier, same provider as the hosted Postgres. Uploads pass
through the server so validation (size, magic bytes, no SVG) can't be skipped.

### 8. Upstash-compatible Redis for rate limiting

**Decision:** a small rate limiter with a memory store and an Upstash REST store.
**Why:** REST works from serverless functions without connection pools. Locally,
`serverless-redis-http` in Docker Compose provides the same API. Failing open is a conscious
choice: a Redis outage shouldn't lock every user out of sign-in.

### 9. Honest "coming soon" instead of placeholder pages

**Decision:** modules that aren't built yet show as disabled "Soon" items, and the dashboard only
shows numbers that exist in the database.
**Why:** fake charts would make the product look further along than it is and train the habit of
presenting invented data. The AI agent will be held to the same rule.

### 10. Testing against a real database

**Decision:** integration tests run against Postgres, not mocks; E2E tests seed sessions directly.
**Why:** tenant isolation, triggers, partial indexes and transactions only prove themselves on the
real engine. Seeding sessions in E2E tests keeps them fast and independent of Google, without a
test-only login route in the app.
