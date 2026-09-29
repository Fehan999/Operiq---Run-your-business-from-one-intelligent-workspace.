# Deployment

A free-tier friendly production setup:

| Piece          | Service           | Notes                                                |
| -------------- | ----------------- | ---------------------------------------------------- |
| App            | Vercel            | Zero-config for Next.js                              |
| Database       | Supabase Postgres | Use the pooler URL at runtime, direct URL to migrate |
| File storage   | Supabase Storage  | Bucket `Operiq`, public read                         |
| Authentication | Firebase Auth     | Email/password + Google                              |
| Rate limiting  | Upstash Redis     | Optional; falls back to per-instance memory          |
| Email          | Resend            | Optional; invitations fall back to copyable links    |

## 1. Database

1. Create a Supabase project and open **Connect**.
2. Copy the **transaction pooler** string (port `6543`) into `DATABASE_URL`. The `pg` driver
   adapter uses unnamed prepared statements, which work through the pooler as is.
3. Copy the **direct** or **session pooler** string (port `5432`) into `DIRECT_URL`.
4. Apply migrations from your machine or CI:

   ```bash
   DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
   ```

## 2. Storage

1. Supabase, Storage: create a bucket named `Operiq` and mark it **public**.
2. Settings, API Keys: copy the publishable key into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and a
   **secret key** into `SUPABASE_SECRET_KEY` (server only, never prefix it with `NEXT_PUBLIC_`).

## 3. Firebase

Follow the console steps in [authentication.md](./authentication.md#firebase-console-setup), and add
the Vercel domain to **Authorized domains**.

## 4. Vercel

1. Import the GitHub repository.
2. Add every variable from `.env.example` in Project Settings, Environment Variables.
   Set `NEXT_PUBLIC_APP_URL` to the production URL (it is used for invitation links, canonical
   URLs and the sitemap).
3. Deploy. The build doesn't need database access; migrations are a separate step.

Recommended: run `prisma migrate deploy` from a GitHub Actions job on `main` before promoting a
deployment, so schema changes land before the code that needs them.

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

- [ ] `NEXT_PUBLIC_APP_URL` uses `https://` (enables HSTS and `upgrade-insecure-requests`)
- [ ] Production domain added to Firebase authorized domains
- [ ] Firebase email action URL points to `/auth/action`
- [ ] `SUPABASE_SECRET_KEY` set, no anonymous insert policy on the bucket
- [ ] Upstash Redis configured so rate limits are shared across instances
- [ ] Migrations applied
