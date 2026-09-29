# Multi-tenancy and authorization

## Tenancy model

The tenant is a **workspace** (the `organizations` table). A user can belong to many workspaces,
each with its own role. Every business record carries an `organization_id`.

Workspaces are addressed by slug in the URL: `/w/<slug>/...`. URL-based tenancy (rather than a
"current workspace" cookie) means two tabs can have two workspaces open without one silently
switching the other, and links are shareable between teammates.

## The workspace context

All tenant access goes through one function:

```ts
const context = await requireWorkspaceAction(slug, "members:invite");
// context.user, context.organization, context.role, context.can(permission)
```

It starts from the **session**, not from the slug:

1. Load the user from the session cookie (and require a verified email).
2. Find a membership where `user_id = session user` and `organization.slug = slug`.
3. If there is none, respond as if the workspace doesn't exist (404 in pages, `NOT_FOUND` in
   actions). Non-members can't even learn that a workspace exists.
4. Derive permissions from the membership role and check the one the action needs.

Services then scope every query with `context.organization.id`, including updates and deletes:

```ts
await db.invitation.updateMany({
  where: { id: invitationId, organizationId: context.organization.id, acceptedAt: null },
  data: { revokedAt: new Date() },
});
```

An id from another workspace simply matches zero rows. `tests/integration/tenant-isolation.test.ts`
tries exactly this for members, invitations, notifications and audit entries.

## Roles and permissions

Roles are `OWNER`, `ADMIN`, `MANAGER`, `MEMBER` and `VIEWER`. The role to permission map lives in
`src/lib/authorization/permissions.ts` and is shown to users on the Roles settings page.

| Permission                | Owner | Admin | Manager | Member | Viewer |
| ------------------------- | :---: | :---: | :-----: | :----: | :----: |
| View customers            |   ✓   |   ✓   |    ✓    |   ✓    |   ✓    |
| Create / update customers |   ✓   |   ✓   |    ✓    |   ✓    |        |
| Delete customers          |   ✓   |   ✓   |    ✓    |        |        |
| Manage leads, tasks, docs |   ✓   |   ✓   |    ✓    |   ✓    |        |
| Manage projects           |   ✓   |   ✓   |    ✓    |        |        |
| View finance, invoices    |   ✓   |   ✓   |    ✓    |        |        |
| Ask the AI agent          |   ✓   |   ✓   |    ✓    |   ✓    |   ✓    |
| Approve AI actions        |   ✓   |   ✓   |    ✓    |   ✓    |        |
| Automations               |   ✓   |   ✓   |    ✓    |        |        |
| Invite / manage members   |   ✓   |   ✓   |         |        |        |
| Workspace settings        |   ✓   |   ✓   |         |        |        |
| Audit log                 |   ✓   |   ✓   |         |        |        |
| Billing                   |   ✓   |       |         |        |        |
| Delete workspace          |   ✓   |       |         |        |        |

A unit test asserts the table is monotonic: a lower role never has a permission a higher role lacks.

### Why roles are defined in code

A fixed map is easy to review in one file, has no query cost, and is testable without a database.
Custom roles can be added later as extra per-workspace grants without changing any call site,
because everything goes through `hasPermission` / `context.can`.

## Managing people

`src/modules/members/policy.ts` holds pure rules on top of permissions:

- You can act only on members ranked **strictly below** you, and only assign roles below yours.
  Owners are the exception.
- Nobody can change their own role.
- A workspace always keeps at least one owner (demotion, removal and leaving all check this).
- Owner count checks run inside a transaction that locks the organization row.

## UI vs server

The client receives the list of permissions to decide what to render (for example hiding
"Invite people" for viewers). That is only for convenience. Every server action re-resolves the
context and re-checks permissions, so a crafted request from the browser gets `FORBIDDEN`.

## Plans and limits

Limits (seats, customers, AI requests) live in `src/config/plans.ts`. Services read them
through `getLimit(plan, key)` instead of hardcoding numbers. Seat limits already count pending
invitations; the others will be enforced as their modules ship.
