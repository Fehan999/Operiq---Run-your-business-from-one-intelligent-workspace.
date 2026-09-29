# Security

Security measures in place today, and the known gaps.

## In place

| Area               | Measure                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Authentication     | Firebase ID tokens verified against Google JWKS; fresh sign-in required for new sessions         |
| Sessions           | Random 256-bit token, httpOnly + SameSite=Lax + Secure cookie, only the SHA-256 hash stored      |
| Session management | Revoke one or all other sessions; expired sessions deleted on use                                |
| Tenant isolation   | Workspace resolved from membership; every query scoped by `organization_id`; integration tested  |
| Authorization      | Role permissions checked in every server action, not just hidden in the UI                       |
| Input validation   | Zod on every action, including ids and slugs; closed enums for roles, currencies, industries     |
| CSRF               | Server Actions only accept same-origin requests; session cookie is SameSite=Lax                  |
| XSS                | React escaping; no user HTML rendered; emails escape all user values; JSON-LD escapes `<`        |
| SQL injection      | Prisma parameterises queries; the one raw query uses tagged templates                            |
| File uploads       | Size limit, magic-byte type detection, SVG refused, server-generated object keys                 |
| Rate limiting      | Sign-in, invitations, uploads and workspace creation; Redis-backed when configured               |
| Audit log          | Append-only, enforced by a database trigger; records IP, user agent and request id               |
| Headers            | CSP (`frame-ancestors`, `object-src`, `base-uri`, `form-action`), X-Frame-Options, nosniff, HSTS |
| Indexing           | Private routes send `X-Robots-Tag: noindex` and are disallowed in robots.txt                     |
| Secrets            | Validated at runtime, never sent to the client; logs redact token/password/cookie fields         |
| Errors             | Unknown errors return a generic message with a reference id; details stay in server logs         |
| Enumeration        | Password reset shows the same message for unknown emails; non-members get 404 for workspaces     |

## Invitations

- Tokens are random, sent once in the link, stored hashed.
- A link only works for a signed-in user whose **verified** email matches the invitation.
- Re-inviting revokes the previous link; resending rotates the token.
- Seven day expiry; acceptance is atomic.

## Storage

Images are uploaded through a server action, never directly from the browser to the bucket. Set
`SUPABASE_SECRET_KEY` so the server writes with the secret key and the bucket can stay closed to
anonymous writes. If only the publishable key is available, the bucket needs an insert policy for
the `anon` role, which also allows direct uploads that bypass validation, so treat that as a
development-only setup.

Recommended bucket setup (Supabase SQL editor), public read and server-only writes:

```sql
-- Bucket "Operiq" marked Public in the dashboard gives read access through public URLs.
-- No INSERT/UPDATE/DELETE policies for anon or authenticated roles: only the secret key writes.
```

## Known gaps and next steps

- **CSP script-src**: scripts are not yet restricted with nonces because Firebase Auth loads
  Google scripts and frames at runtime. Next step: nonce-based CSP generated in `proxy.ts`.
- **Password reset does not revoke existing sessions** automatically, because Firebase does not
  notify the app. Users can revoke sessions from Settings; a Firebase blocking function or a
  periodic token check could close this.
- **MFA and passkeys** are on the roadmap (Firebase supports TOTP MFA).
- **Malware scanning** for uploaded documents will be needed when document upload ships.
