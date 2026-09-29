import "server-only";

import { db } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

// Expired invitations stay visible (with a "Resend" button) for a month before they go.
export const EXPIRED_INVITATION_RETENTION_DAYS = 30;

/**
 * Housekeeping for rows that are no longer useful. Audit log entries are never touched
 * here; they are append-only by design.
 */
export async function cleanupExpiredRecords(now = new Date()) {
  const invitationCutoff = new Date(now.getTime() - EXPIRED_INVITATION_RETENTION_DAYS * DAY_MS);

  const [sessions, invitations] = await Promise.all([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.invitation.deleteMany({
      where: { acceptedAt: null, expiresAt: { lt: invitationCutoff } },
    }),
  ]);

  return { expiredSessions: sessions.count, staleInvitations: invitations.count };
}
