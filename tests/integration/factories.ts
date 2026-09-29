import type { MemberRole } from "@/generated/prisma/client";
import { hasPermission } from "@/lib/authorization/permissions";
import { db } from "@/lib/db";
import type { SessionUser } from "@/modules/auth/session";
import type { WorkspaceContext } from "@/modules/organizations/context";

let counter = 0;
const next = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

export async function createUser(
  overrides: { email?: string; name?: string; verified?: boolean } = {},
) {
  const id = next();
  return db.user.create({
    data: {
      firebaseUid: `firebase-${id}`,
      email: overrides.email ?? `user-${id}@example.com`,
      name: overrides.name ?? `User ${id}`,
      emailVerifiedAt: overrides.verified === false ? null : new Date(),
    },
  });
}

export function toSessionUser(user: Awaited<ReturnType<typeof createUser>>): SessionUser {
  return {
    id: user.id,
    firebaseUid: user.firebaseUid,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerifiedAt: user.emailVerifiedAt,
    lastOrganizationId: user.lastOrganizationId,
  };
}

export async function createWorkspace(name = "Acme") {
  return db.organization.create({ data: { name, slug: `${name.toLowerCase()}-${next()}` } });
}

export async function addMember(organizationId: string, userId: string, role: MemberRole) {
  return db.organizationMember.create({ data: { organizationId, userId, role } });
}

/** Builds the same context object the server resolves from a real session. */
export async function contextFor(
  userId: string,
  organizationId: string,
): Promise<WorkspaceContext> {
  const membership = await db.organizationMember.findUniqueOrThrow({
    where: { organizationId_userId: { organizationId, userId } },
    include: { organization: true, user: true },
  });
  const role = membership.role;
  return {
    user: toSessionUser(membership.user),
    organization: membership.organization,
    membership: { id: membership.id, role, jobTitle: membership.jobTitle },
    role,
    can: (permission) => hasPermission(role, permission),
  };
}
