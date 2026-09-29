import "server-only";

import type { MemberRole } from "@/generated/prisma/client";
import { db, type TransactionClient } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { ROLE_DETAILS } from "@/lib/authorization/permissions";
import { recordActivity } from "@/modules/activity/service";
import { recordAuditLog } from "@/modules/audit/service";
import {
  canChangeRole,
  canLeaveWorkspace,
  canRemoveMember,
  type PolicyResult,
} from "@/modules/members/policy";
import { createNotification } from "@/modules/notifications/service";
import type { WorkspaceContext } from "@/modules/organizations/context";

export async function listMembers(organizationId: string) {
  return db.organizationMember.findMany({
    where: { organizationId },
    // Postgres sorts enums by declaration order, which is also rank order.
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      jobTitle: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
}

export type MemberListItem = Awaited<ReturnType<typeof listMembers>>[number];

export async function getOwnerCount(organizationId: string) {
  return db.organizationMember.count({ where: { organizationId, role: "OWNER" } });
}

const EXPIRING_SOON_MS = 2 * 24 * 60 * 60 * 1000;

export async function getMemberCounts(organizationId: string, now = new Date()) {
  const open = { organizationId, acceptedAt: null, revokedAt: null };
  const [members, pendingInvitations, invitationsExpiringSoon] = await Promise.all([
    db.organizationMember.count({ where: { organizationId } }),
    db.invitation.count({ where: { ...open, expiresAt: { gt: now } } }),
    db.invitation.count({
      where: { ...open, expiresAt: { gt: now, lt: new Date(now.getTime() + EXPIRING_SOON_MS) } },
    }),
  ]);
  return { members, pendingInvitations, invitationsExpiringSoon };
}

/**
 * Locks the organization row for the rest of the transaction. Role changes and removals
 * check "is there still another owner?", and without the lock two owners demoting each
 * other at the same moment could both pass that check.
 */
async function lockOrganization(tx: TransactionClient, organizationId: string) {
  await tx.$queryRaw`SELECT id FROM organizations WHERE id = ${organizationId} FOR UPDATE`;
}

async function countOwners(tx: TransactionClient, organizationId: string) {
  return tx.organizationMember.count({ where: { organizationId, role: "OWNER" } });
}

function enforce(result: PolicyResult) {
  if (!result.allowed) throw new AppError("FORBIDDEN", result.reason);
}

export async function changeMemberRole(
  context: WorkspaceContext,
  memberId: string,
  newRole: MemberRole,
) {
  const { organization, user, role: actorRole } = context;

  await db.$transaction(async (tx) => {
    await lockOrganization(tx, organization.id);

    const target = await tx.organizationMember.findFirst({
      where: { id: memberId, organizationId: organization.id },
      select: { id: true, role: true, userId: true },
    });
    if (!target) throw new AppError("NOT_FOUND", "That member is no longer in this workspace.");

    const owners = await countOwners(tx, organization.id);
    enforce(
      canChangeRole(
        { userId: user.id, role: actorRole },
        { userId: target.userId, role: target.role },
        newRole,
        owners,
      ),
    );

    await tx.organizationMember.update({ where: { id: target.id }, data: { role: newRole } });

    await recordAuditLog(
      {
        action: "member.role_changed",
        organizationId: organization.id,
        actorId: user.id,
        targetType: "member",
        targetId: target.id,
        changes: { before: { role: target.role }, after: { role: newRole } },
        metadata: { userId: target.userId },
      },
      tx,
    );
    await recordActivity(
      {
        organizationId: organization.id,
        actorId: user.id,
        type: "member.role_changed",
        entityType: "user",
        entityId: target.userId,
        data: { from: target.role, to: newRole },
      },
      tx,
    );
    await createNotification(
      {
        organizationId: organization.id,
        recipientId: target.userId,
        type: "role.changed",
        title: `Your role in ${organization.name} is now ${ROLE_DETAILS[newRole].label}`,
        link: `/w/${organization.slug}/settings/roles`,
      },
      tx,
    );
  });
}

export async function removeMember(context: WorkspaceContext, memberId: string) {
  const { organization, user, role: actorRole } = context;

  await db.$transaction(async (tx) => {
    await lockOrganization(tx, organization.id);

    const target = await tx.organizationMember.findFirst({
      where: { id: memberId, organizationId: organization.id },
      select: { id: true, role: true, userId: true, user: { select: { email: true } } },
    });
    if (!target) throw new AppError("NOT_FOUND", "That member is no longer in this workspace.");

    const owners = await countOwners(tx, organization.id);
    enforce(
      canRemoveMember(
        { userId: user.id, role: actorRole },
        { userId: target.userId, role: target.role },
        owners,
      ),
    );

    await tx.organizationMember.delete({ where: { id: target.id } });
    await tx.user.updateMany({
      where: { id: target.userId, lastOrganizationId: organization.id },
      data: { lastOrganizationId: null },
    });

    await recordAuditLog(
      {
        action: "member.removed",
        organizationId: organization.id,
        actorId: user.id,
        targetType: "member",
        targetId: target.id,
        changes: { before: { role: target.role }, after: {} },
        metadata: { userId: target.userId, email: target.user.email },
      },
      tx,
    );
    await recordActivity(
      {
        organizationId: organization.id,
        actorId: user.id,
        type: "member.removed",
        entityType: "user",
        entityId: target.userId,
        data: { email: target.user.email },
      },
      tx,
    );
  });
}

export async function leaveWorkspace(context: WorkspaceContext) {
  const { organization, user, membership } = context;

  await db.$transaction(async (tx) => {
    await lockOrganization(tx, organization.id);
    const current = await tx.organizationMember.findFirst({
      where: { id: membership.id, organizationId: organization.id },
      select: { id: true, role: true },
    });
    if (!current) return;

    const owners = await countOwners(tx, organization.id);
    enforce(canLeaveWorkspace({ userId: user.id, role: current.role }, owners));

    await tx.organizationMember.delete({ where: { id: current.id } });
    await tx.user.updateMany({
      where: { id: user.id, lastOrganizationId: organization.id },
      data: { lastOrganizationId: null },
    });
    await recordAuditLog(
      {
        action: "member.left",
        organizationId: organization.id,
        actorId: user.id,
        targetType: "member",
        targetId: current.id,
      },
      tx,
    );
    await recordActivity(
      {
        organizationId: organization.id,
        actorId: user.id,
        type: "member.left",
        entityType: "user",
        entityId: user.id,
      },
      tx,
    );
  });
}

export async function updateOwnJobTitle(context: WorkspaceContext, jobTitle: string | null) {
  await db.organizationMember.update({
    where: { id: context.membership.id },
    data: { jobTitle },
  });
}
