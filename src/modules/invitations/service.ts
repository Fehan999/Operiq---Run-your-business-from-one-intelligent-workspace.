import "server-only";

import type { MemberRole, Prisma } from "@/generated/prisma/client";
import { getLimit } from "@/config/plans";
import { publicEnv } from "@/config/public-env";
import { db, type TransactionClient } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { invitationEmail } from "@/lib/email/templates/invitation";
import { AppError } from "@/lib/errors";
import { generateToken, hashToken } from "@/lib/security/tokens";
import { recordActivity } from "@/modules/activity/service";
import { recordAuditLog } from "@/modules/audit/service";
import type { SessionUser } from "@/modules/auth/session";
import { canInviteWithRole } from "@/modules/members/policy";
import { createNotification } from "@/modules/notifications/service";
import type { WorkspaceContext } from "@/modules/organizations/context";
import type { InviteEntry } from "@/modules/invitations/schemas";

/*
 * Invitations are bearer links, but a link alone is not enough to join: the person
 * accepting must be signed in with a verified email that matches the invitation.
 * Only a hash of the token is stored, so the database cannot be used to forge links.
 */

export const INVITATION_TTL_DAYS = 7;
const INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000;

export function invitationUrl(token: string) {
  return `${publicEnv.appUrl}/invite/${token}`;
}

const pendingWhere = (now = new Date()): Prisma.InvitationWhereInput => ({
  acceptedAt: null,
  revokedAt: null,
  expiresAt: { gt: now },
});

export interface InvitationResult {
  email: string;
  status: "invited" | "already_member" | "skipped_self";
  inviteUrl?: string;
  emailed?: boolean;
}

export async function createInvitations(
  context: WorkspaceContext,
  entries: InviteEntry[],
): Promise<InvitationResult[]> {
  const { organization, user, role: actorRole } = context;

  for (const entry of entries) {
    const decision = canInviteWithRole(actorRole, entry.role);
    if (!decision.allowed) throw new AppError("FORBIDDEN", decision.reason);
  }

  const unique = new Map<string, InviteEntry>();
  for (const entry of entries) unique.set(entry.email, entry);

  const results: InvitationResult[] = [];
  const toInvite: InviteEntry[] = [];

  const existingMembers = await db.organizationMember.findMany({
    where: { organizationId: organization.id, user: { email: { in: [...unique.keys()] } } },
    select: { user: { select: { email: true } } },
  });
  const memberEmails = new Set(existingMembers.map((member) => member.user.email));

  for (const entry of unique.values()) {
    if (entry.email === user.email) results.push({ email: entry.email, status: "skipped_self" });
    else if (memberEmails.has(entry.email))
      results.push({ email: entry.email, status: "already_member" });
    else toInvite.push(entry);
  }

  if (toInvite.length === 0) return results;

  const [memberCount, pendingCount] = await Promise.all([
    db.organizationMember.count({ where: { organizationId: organization.id } }),
    db.invitation.count({
      where: {
        organizationId: organization.id,
        ...pendingWhere(),
        email: { notIn: toInvite.map((entry) => entry.email) },
      },
    }),
  ]);
  const seatLimit = getLimit(organization.plan, "members");
  if (memberCount + pendingCount + toInvite.length > seatLimit) {
    throw new AppError(
      "LIMIT_REACHED",
      `Your plan includes ${seatLimit} seats, including pending invitations. Remove an invitation or upgrade to add more people.`,
    );
  }

  const created = await db.$transaction(async (tx) => {
    const rows: Array<{ id: string; email: string; role: MemberRole; token: string }> = [];
    for (const entry of toInvite) {
      // Re-inviting replaces any open invitation for the same address.
      await tx.invitation.updateMany({
        where: {
          organizationId: organization.id,
          email: entry.email,
          acceptedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      const token = generateToken();
      const invitation = await tx.invitation.create({
        data: {
          organizationId: organization.id,
          email: entry.email,
          role: entry.role,
          tokenHash: hashToken(token),
          invitedById: user.id,
          expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
        },
        select: { id: true, email: true, role: true },
      });

      await recordAuditLog(
        {
          action: "invitation.created",
          organizationId: organization.id,
          actorId: user.id,
          targetType: "invitation",
          targetId: invitation.id,
          metadata: { email: invitation.email, role: invitation.role },
        },
        tx,
      );
      await recordActivity(
        {
          organizationId: organization.id,
          actorId: user.id,
          type: "member.invited",
          entityType: "invitation",
          entityId: invitation.id,
          data: { email: invitation.email, role: invitation.role },
        },
        tx,
      );
      rows.push({ ...invitation, token });
    }
    return rows;
  });

  // Emails go out after the commit, so a slow provider never holds the transaction open.
  const inviterName = user.name ?? user.email;
  for (const row of created) {
    const inviteUrl = invitationUrl(row.token);
    const message = invitationEmail({
      workspaceName: organization.name,
      inviterName,
      role: row.role,
      acceptUrl: inviteUrl,
      expiresInDays: INVITATION_TTL_DAYS,
    });
    const { delivered } = await sendEmail({ to: row.email, ...message });
    results.push({ email: row.email, status: "invited", inviteUrl, emailed: delivered });
  }

  return results;
}

export async function listOpenInvitations(organizationId: string) {
  const rows = await db.invitation.findMany({
    where: { organizationId, acceptedAt: null, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { name: true, email: true } },
    },
  });
  const now = Date.now();
  return rows.map((row) => ({ ...row, expired: row.expiresAt.getTime() <= now }));
}

export type OpenInvitation = Awaited<ReturnType<typeof listOpenInvitations>>[number];

export async function revokeInvitation(context: WorkspaceContext, invitationId: string) {
  const { organization, user } = context;
  const { count } = await db.invitation.updateMany({
    where: { id: invitationId, organizationId: organization.id, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) throw new AppError("NOT_FOUND", "That invitation no longer exists.");

  await recordAuditLog({
    action: "invitation.revoked",
    organizationId: organization.id,
    actorId: user.id,
    targetType: "invitation",
    targetId: invitationId,
  });
}

/** Issues a fresh token and expiry. The old link stops working immediately. */
export async function resendInvitation(context: WorkspaceContext, invitationId: string) {
  const { organization, user, role } = context;
  const invitation = await db.invitation.findFirst({
    where: { id: invitationId, organizationId: organization.id, acceptedAt: null, revokedAt: null },
    select: { id: true, email: true, role: true },
  });
  if (!invitation) throw new AppError("NOT_FOUND", "That invitation no longer exists.");

  const decision = canInviteWithRole(role, invitation.role);
  if (!decision.allowed) throw new AppError("FORBIDDEN", decision.reason);

  const token = generateToken();
  await db.invitation.update({
    where: { id: invitation.id },
    data: { tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITATION_TTL_MS) },
  });

  const inviteUrl = invitationUrl(token);
  const { delivered } = await sendEmail({
    to: invitation.email,
    ...invitationEmail({
      workspaceName: organization.name,
      inviterName: user.name ?? user.email,
      role: invitation.role,
      acceptUrl: inviteUrl,
      expiresInDays: INVITATION_TTL_DAYS,
    }),
  });

  return { inviteUrl, emailed: delivered };
}

export type InvitationPreview =
  | { status: "invalid" }
  | {
      status: "pending" | "expired" | "revoked" | "accepted";
      email: string;
      role: MemberRole;
      organization: { name: string; slug: string; logoUrl: string | null };
      invitedBy: string | null;
    };

export async function getInvitationPreview(token: string): Promise<InvitationPreview> {
  if (!token || token.length > 128) return { status: "invalid" };

  const invitation = await db.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      email: true,
      role: true,
      acceptedAt: true,
      revokedAt: true,
      expiresAt: true,
      organization: { select: { name: true, slug: true, logoUrl: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });
  if (!invitation) return { status: "invalid" };

  const status = invitation.acceptedAt
    ? "accepted"
    : invitation.revokedAt
      ? "revoked"
      : invitation.expiresAt.getTime() <= Date.now()
        ? "expired"
        : "pending";

  return {
    status,
    email: invitation.email,
    role: invitation.role,
    organization: invitation.organization,
    invitedBy: invitation.invitedBy?.name ?? invitation.invitedBy?.email ?? null,
  };
}

/** Pending invitations addressed to the signed-in user, shown during onboarding. */
export async function listInvitationsForUser(user: SessionUser) {
  return db.invitation.findMany({
    where: { email: user.email, ...pendingWhere() },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      role: true,
      organization: { select: { name: true, logoUrl: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });
}

async function claimInvitation(
  tx: TransactionClient,
  user: SessionUser,
  where: Prisma.InvitationWhereUniqueInput,
) {
  const invitation = await tx.invitation.findUnique({
    where,
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true,
      invitedById: true,
      acceptedAt: true,
      revokedAt: true,
      expiresAt: true,
      organization: { select: { slug: true, name: true } },
    },
  });

  if (!invitation) throw new AppError("NOT_FOUND", "This invitation link is not valid.");
  if (invitation.email !== user.email.toLowerCase()) {
    throw new AppError(
      "FORBIDDEN",
      `This invitation was sent to ${invitation.email}. Sign in with that address to accept it.`,
    );
  }
  if (invitation.revokedAt) throw new AppError("NOT_FOUND", "This invitation was revoked.");
  if (invitation.acceptedAt) {
    const alreadyMember = await tx.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: invitation.organizationId, userId: user.id },
      },
      select: { id: true },
    });
    if (alreadyMember) return { slug: invitation.organization.slug, joined: false };
    throw new AppError("CONFLICT", "This invitation has already been used.");
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    throw new AppError("NOT_FOUND", "This invitation has expired. Ask for a new one.");
  }

  // The conditional update makes acceptance atomic: two concurrent clicks cannot both win.
  const { count } = await tx.invitation.updateMany({
    where: { id: invitation.id, acceptedAt: null, revokedAt: null },
    data: { acceptedAt: new Date() },
  });
  if (count === 0) throw new AppError("CONFLICT", "This invitation has already been used.");

  const existing = await tx.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId: invitation.organizationId, userId: user.id },
    },
    select: { id: true },
  });

  if (!existing) {
    await tx.organizationMember.create({
      data: { organizationId: invitation.organizationId, userId: user.id, role: invitation.role },
    });
    await recordActivity(
      {
        organizationId: invitation.organizationId,
        actorId: user.id,
        type: "member.joined",
        entityType: "user",
        entityId: user.id,
        data: { role: invitation.role },
      },
      tx,
    );
    if (invitation.invitedById && invitation.invitedById !== user.id) {
      await createNotification(
        {
          organizationId: invitation.organizationId,
          recipientId: invitation.invitedById,
          type: "invitation.accepted",
          title: `${user.name ?? user.email} joined ${invitation.organization.name}`,
          link: `/w/${invitation.organization.slug}/settings/members`,
        },
        tx,
      );
    }
  }

  await tx.user.update({
    where: { id: user.id },
    data: { lastOrganizationId: invitation.organizationId },
  });

  await recordAuditLog(
    {
      action: "invitation.accepted",
      organizationId: invitation.organizationId,
      actorId: user.id,
      targetType: "invitation",
      targetId: invitation.id,
      metadata: { role: invitation.role },
    },
    tx,
  );

  return { slug: invitation.organization.slug, joined: !existing };
}

export async function acceptInvitationByToken(user: SessionUser, token: string) {
  if (!token || token.length > 128)
    throw new AppError("NOT_FOUND", "This invitation link is not valid.");
  return db.$transaction((tx) => claimInvitation(tx, user, { tokenHash: hashToken(token) }));
}

export async function acceptInvitationById(user: SessionUser, invitationId: string) {
  return db.$transaction((tx) => claimInvitation(tx, user, { id: invitationId }));
}
