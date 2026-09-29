import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { createSession } from "@/modules/auth/session";
import { cleanupExpiredRecords } from "@/modules/maintenance/service";

import { createUser, createWorkspace } from "./factories";

const DAY = 24 * 60 * 60 * 1000;
const request = { ipAddress: null, userAgent: null, requestId: null };

async function invitation(
  organizationId: string,
  email: string,
  expiresInDays: number,
  accepted = false,
) {
  return db.invitation.create({
    data: {
      organizationId,
      email,
      tokenHash: `${email}-${expiresInDays}`,
      expiresAt: new Date(Date.now() + expiresInDays * DAY),
      acceptedAt: accepted ? new Date() : null,
    },
  });
}

describe("cleanupExpiredRecords", () => {
  it("removes expired sessions and long-expired invitations, nothing else", async () => {
    const user = await createUser();
    const workspace = await createWorkspace();

    const { session: live } = await createSession(user.id, request);
    const { session: dead } = await createSession(user.id, request);
    await db.session.update({
      where: { id: dead.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const recent = await invitation(workspace.id, "recent@x.test", -3);
    const stale = await invitation(workspace.id, "stale@x.test", -45);
    const accepted = await invitation(workspace.id, "accepted@x.test", -60, true);

    const result = await cleanupExpiredRecords();

    expect(result).toEqual({ expiredSessions: 1, staleInvitations: 1 });
    expect(await db.session.findUnique({ where: { id: live.id } })).not.toBeNull();
    expect(await db.invitation.findUnique({ where: { id: recent.id } })).not.toBeNull();
    expect(await db.invitation.findUnique({ where: { id: accepted.id } })).not.toBeNull();
    expect(await db.invitation.findUnique({ where: { id: stale.id } })).toBeNull();
  });
});
