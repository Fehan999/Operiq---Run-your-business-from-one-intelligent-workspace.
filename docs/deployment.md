# Deployment

A free-tier friendly production setup:

| Piece          | Service           | Notes                                                    |
| -------------- | ----------------- | -------------------------------------------------------- |
| App            | Vercel            | `vercel.json` sets the build, region and cron            |
| Database       | Supabase Postgres | Transaction pooler at runtime, session pooler to migrate |
| File storage   | Supabase Storage  | Bucket `Operiq`, public read                             |
| Authentication | Firebase Auth     | Email/password + Google                                  |
| Rate limiting  | Upstash Redis     | Optional; falls back to per-instance memory              |
| Email          | Resend            | Optional; invitations fall back to copyable links        |

## What the repository already handles

- **Build.** Vercel runs `npm run vercel-build`, which generates the Prisma client and builds Next.js.
- **Migrations.** On production deploys (`VERCEL_ENV=production`) the build first runs
  `prisma migrate deploy` through `DIRECT_URL`. A failing migration fails the deploy, so the old
  version keeps serving. Preview deploys never touch the schema.
- **Region.** Functions run in `bom1` (Mumbai), next to a Supabase project in `ap-south-1`. If your
  database lives elsewhere, change `regions` in `vercel.json` to the closest Vercel region.
- **App URL.** When `NEXT_PUBLIC_APP_URL` is empty the app uses the project's production domain on
  production and the deployment's own domain on previews, so invite links always point somewhere real.
- **Connection pools.** Each serverless instance keeps at most 5 connections, which keeps the
  Supabase pooler comfortable when Vercel scales out.
- **Health check.** `GET /api/health` returns `200` with the database round-trip time, or `503` when
  Postgres is unreachable. Point an uptime monitor at it.
- **Cleanup cron.** Once a day Vercel calls `/api/cron/cleanup`, which deletes expired sessions and
  invitations that expired more than 30 days ago. It only runs when `CRON_SECRET` is set.
- **Security headers.** HSTS and `upgrade-insecure-requests` switch on automatically on Vercel.

## 1. Database

1. Create a Supabase project and open **Connect**.
2. Copy the **transaction pooler** string (port `6543`) into `DATABASE_URL` and append
   `?pgbouncer=true`. The `pg` driver adapter uses unnamed prepared statements, which work through
   the pooler as is.
3. Copy the **session pooler** string (port `5432`) into `DIRECT_URL`. Avoid the "direct connection"
   host on the free plan: it is IPv6 only and Vercel builds can't reach it.
4. Replace `[YOUR-PASSWORD]` in both. If the password contains characters such as `@ # / ? %`,
   URL-encode them (`@` becomes `%40`) or reset it to a letters-and-digits password.

Migrations run automatically on the first production deploy. To apply them by hand instead:

```bash
DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
```

## 2. Storage

1. Supabase, Storage: create a bucket named `Operiq` and mark it **public**.
2. Settings, API Keys: copy the publishable key into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and a
   **secret key** into `SUPABASE_SECRET_KEY` (server only, never prefix it with `NEXT_PUBLIC_`).
3. Don't add an insert policy for the `anon` role. Uploads go through the server with the secret key.

## 3. Firebase

Follow the console steps in [authentication.md](./authentication.md#firebase-console-setup), then add
your Vercel domain (for example `operiq.vercel.app`) to Authentication, Settings, **Authorized
domains**. Google sign-in fails with `auth/unauthorized-domain` until you do.

## 4. Vercel

1. **Add New, Project**, import the GitHub repository. Leave framework, build command and output
   directory on their defaults; `vercel.json` sets them.
2. Before the first deploy, open **Environment Variables** and add every variable from
   `.env.example` for **Production** and **Preview**:
   - `DATABASE_URL`, `DIRECT_URL`
   - all `NEXT_PUBLIC_FIREBASE_*`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
     `SUPABASE_STORAGE_BUCKET`
   - `CRON_SECRET`: a long random string, e.g. the output of
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `NEXT_PUBLIC_APP_URL`: your final domain, or leave it out to use the Vercel domain
   - optional: `RESEND_API_KEY`, `EMAIL_FROM`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
     `NEXT_PUBLIC_AUTHOR_LINKEDIN_URL`, `LOG_LEVEL`
3. Deploy. The build log shows `prisma migrate deploy` applying the migrations.
4. Open `https://<your-domain>/api/health`; it should answer `{"status":"ok",...}`.

`NEXT_PUBLIC_*` values are baked into the client bundle at build time. After changing one, redeploy.

### Custom domain

Add it under Settings, Domains, then set `NEXT_PUBLIC_APP_URL` to it, add it to Firebase authorized
domains, and redeploy.

## Troubleshooting

- **`P1000: Authentication failed` during the build.** The database password in `DIRECT_URL` is
  wrong. Check that `[YOUR-PASSWORD]` was replaced (square brackets removed too), or reset the
  password in Supabase, Project Settings, Database, and paste it into both `DATABASE_URL` and
  `DIRECT_URL`. Environment variable changes only apply to new deployments, so redeploy afterwards.
- **`Tenant or user not found`.** The username or host is wrong. Copy both strings again from
  Supabase, Connect; the username has the form `postgres.<project-ref>`.
- **`auth/unauthorized-domain` when signing in.** Add the domain to Firebase authorized domains.
- **The build log says it runs in Washington (`iad1`).** That's expected: builds always run there.
  The region in `vercel.json` only applies to the functions serving requests.

## Docker

The `Dockerfile` builds Next.js standalone output into a small Node 22 Alpine image running as a
non-root user.

```bash
docker compose up -d                 # Postgres, Redis and the Upstash-compatible REST proxy
docker compose --profile app up -d   # also migrates and runs the production image on :3000
```

Public `NEXT_PUBLIC_*` values are compiled into the client bundle, so pass them as build args
(Compose reads them from your shell or a `.env` file).

## Checklist

- [ ] `[YOUR-PASSWORD]` replaced (and URL-encoded) in `DATABASE_URL` and `DIRECT_URL`
- [ ] All variables added in Vercel for Production and Preview, including `CRON_SECRET`
- [ ] Production domain added to Firebase authorized domains
- [ ] Firebase email action URL points to `/auth/action` (optional, keeps users on your domain)
- [ ] Bucket `Operiq` is public, `SUPABASE_SECRET_KEY` set, no anonymous insert policy
- [ ] `EMAIL_FROM` uses a Resend-verified domain or `onboarding@resend.dev`
- [ ] Upstash Redis configured so rate limits are shared across instances
- [ ] `/api/health` returns `ok` after the first deploy
