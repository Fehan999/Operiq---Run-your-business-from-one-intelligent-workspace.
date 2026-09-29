import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import type * as SessionModule from "@/modules/auth/session";
import type { SessionUser } from "@/modules/auth/session";
import { listAuditLogs, recordAuditLog } from "@/modules/audit/service";
import { revokeInvitation, createInvitations } from "@/modules/invitations/service";
import { changeMemberRole, listMembers, removeMember } from "@/modules/members/service";
import { markAllNotificationsRead, markNotificationRead } from "@/modules/notifications/service";
import { requireWorkspaceAction } from "@/modules/organizations/context";

import { addMember, contextFor, createUser, createWorkspace, toSessionUser } from "./factories";

/*
 * The most important property of a multi-tenant app: nobody can reach another
 * workspace's data, even with a valid id from that workspace in hand.
 */

const sessionState = vi.hoisted(() => ({ user: null as SessionUser | null }));

vi.mock("@/modules/auth/session", async (importOriginal) => {
  const original = await importOriginal<typeof SessionModule>();
  return {
    ...original,
    requireVerifiedUser: vi.fn(async () => {
      if (!sessionState.user) throw new Error("no session");
      return sessionState.user;
    }),
  };
});

async function setup() {
  const alice = await createUser({ email: "alice@acme.test" });
  const bob = await createUser({ email: "bob@globex.test" });
  const acme = await createWorkspace("Acme");
  const globex = await createWorkspace("Globex");
  await addMember(acme.id, alice.id, "OWNER");
  const bobMembership = await addMember(globex.id, bob.id, "OWNER");
  return { alice, bob, acme, globex, bobMembership };
}

describe("tenant isolation", () => {
  beforeEach(() => {
    sessionState.user = null;
  });

  it("does not resolve a workspace the user is not a member of", async () => {
    const { alice, acme, globex } = await setup();
    sessionState.user = toSessionUser(alice);

    await expect(requireWorkspaceAction(acme.slug)).resolves.toMatchObject({
      organization: { id: acme.id },
    });
    await expect(requireWorkspaceAction(globex.slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("checks permissions after membership", async () => {
    const { acme } = await setup();
    const viewer = await createUser();
    await addMember(acme.id, viewer.id, "VIEWER");
    sessionState.user = toSessionUser(viewer);

    await expect(requireWorkspaceAction(acme.slug, "members:invite")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(requireWorkspaceAction(acme.slug, "customers:view")).resolves.toBeTruthy();
  });

  it("cannot change or remove a member of another workspace by id", async () => {
    const { alice, acme, bobMembership } = await setup();
    const context = await contextFor(alice.id, acme.id);

    await expect(changeMemberRole(context, bobMembership.id, "VIEWER")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(removeMember(context, bobMembership.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    const untouched = await db.organizationMember.findUniqueOrThrow({
      where: { id: bobMembership.id },
    });
    expect(untouched.role).toBe("OWNER");
  });

  it("cannot revoke another workspace's invitation", async () => {
    const { alice, bob, acme, globex } = await setup();
    const bobContext = await contextFor(bob.id, globex.id);
    await createInvitations(bobContext, [{ email: "new@globex.test", role: "MEMBER" }]);
    const invitation = await db.invitation.findFirstOrThrow({
      where: { organizationId: globex.id },
    });

    const aliceContext = await contextFor(alice.id, acme.id);
    await expect(revokeInvitation(aliceContext, invitation.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    const reloaded = await db.invitation.findUniqueOrThrow({ where: { id: invitation.id } });
    expect(reloaded.revokedAt).toBeNull();
  });

  it("only lists members and audit entries from the current workspace", async () => {
    const { alice, bob, acme, globex } = await setup();
    await recordAuditLog({
      action: "workspace.updated",
      organizationId: acme.id,
      actorId: alice.id,
    });
    await recordAuditLog({
      action: "workspace.updated",
      organizationId: globex.id,
      actorId: bob.id,
    });

    const members = await listMembers(acme.id);
    expect(members.map((member) => member.user.email)).toEqual(["alice@acme.test"]);

    const { items } = await listAuditLogs(acme.id);
    expect(items).toHaveLength(1);
    expect(items[0]!.actor?.id).toBe(alice.id);
  });

  it("scopes notifications to both the recipient and the workspace", async () => {
    const { alice, bob, acme, globex } = await setup();
    const bobs = await db.notification.create({
      data: {
        organizationId: globex.id,
        recipientId: bob.id,
        type: "member.joined",
        title: "Hi Bob",
      },
    });

    await markNotificationRead(acme.id, alice.id, bobs.id);
    await markAllNotificationsRead(acme.id, alice.id);

    const reloaded = await db.notification.findUniqueOrThrow({ where: { id: bobs.id } });
    expect(reloaded.readAt).toBeNull();
  });
});
